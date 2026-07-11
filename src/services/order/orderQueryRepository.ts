import type { PostgrestError } from "@supabase/supabase-js";
import { OrderMappingError } from "@/lib/errors";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type {
	DescriptionConflictResult,
	DuplicateCheckResult,
	OrderStage,
	OrderStageCounts,
	PendingRow,
} from "@/types";
import { mapSupabaseOrder } from "../orderMapper";
import {
	ORDERS_SELECT_BASE,
	ORDERS_SELECT_WITH_ATTACHMENTS,
} from "../orderRepositorySelects";
import {
	handleSupabaseError,
	isMissingAttachmentColumnError,
} from "../orderServiceErrors";

// PostgREST caps each response at a fixed row count (default max 1000). Any
// select without an explicit range silently truncates once a stage exceeds the
// cap, so all full-table reads must page through every window.
const SUPABASE_MAX_ROWS = 1000;

// Escapes Postgres LIKE/ILIKE metacharacters (`%`, `_`) so user-supplied VIN
// and part-number input is matched literally instead of as a wildcard
// pattern. The escape character itself must be escaped first.
function escapeLikePattern(input: string): string {
	return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function fetchAllPages<T>(
	buildPage: (
		from: number,
		to: number,
	) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
	const rows: T[] = [];
	let from = 0;
	for (;;) {
		const { data, error } = await buildPage(from, from + SUPABASE_MAX_ROWS - 1);
		if (error) return { data: null, error };
		const page = data ?? [];
		rows.push(...page);
		if (page.length < SUPABASE_MAX_ROWS) break;
		from += SUPABASE_MAX_ROWS;
	}
	return { data: rows, error: null };
}

// Same paging contract as fetchAllPages, but stops as soon as `check` finds a
// match instead of draining every remaining page first — used by the
// duplicate-check queries below, which only need the first match, not the
// full result set.
async function scanPages<T, R>(
	buildPage: (
		from: number,
		to: number,
	) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
	check: (row: T) => R | undefined,
): Promise<{ result: R | undefined; error: PostgrestError | null }> {
	let from = 0;
	for (;;) {
		const { data, error } = await buildPage(from, from + SUPABASE_MAX_ROWS - 1);
		if (error) return { result: undefined, error };
		const page = data ?? [];
		for (const row of page) {
			const result = check(row);
			if (result !== undefined) return { result, error: null };
		}
		if (page.length < SUPABASE_MAX_ROWS) break;
		from += SUPABASE_MAX_ROWS;
	}
	return { result: undefined, error: null };
}

export function createOrderQueryRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	return {
		async getOrders(stage?: OrderStage) {
			// A secondary `.order("id")` tiebreak is required so pages don't skip
			// or duplicate rows when `created_at` values tie at a page boundary.
			const makePage =
				<S extends string>(select: S) =>
				(from: number, to: number) => {
					let q = db.from("orders").select(select);
					if (stage) {
						q = q.eq("stage", stage);
					}
					return q
						.order("created_at", { ascending: false })
						.order("id", { ascending: true })
						.range(from, to) as unknown as PromiseLike<{
						data: Record<string, unknown>[] | null;
						error: PostgrestError | null;
					}>;
				};

			const { data, error } = await fetchAllPages(
				makePage(ORDERS_SELECT_WITH_ATTACHMENTS),
			);
			if (error && isMissingAttachmentColumnError(error)) {
				const { data: fallbackData, error: fallbackError } =
					await fetchAllPages(makePage(ORDERS_SELECT_BASE));
				if (fallbackError) handleSupabaseError(fallbackError);
				return fallbackData;
			}
			if (error) handleSupabaseError(error);
			return data;
		},

		async fetchMappedOrders(stage: OrderStage): Promise<PendingRow[]> {
			const queryRepo = createOrderQueryRepository(db);
			const data = await queryRepo.getOrders(stage);
			if (!data) return [];
			try {
				return data.map((row) =>
					mapSupabaseOrder(row as Record<string, unknown>),
				);
			} catch (err) {
				if (err instanceof OrderMappingError) throw err;
				throw new OrderMappingError(
					`Unexpected mapping failure in fetchMappedOrders: ${String(err)}`,
				);
			}
		},

		async getDashboardStats(): Promise<OrderStageCounts> {
			const { data, error } = await db.rpc("get_order_stage_counts");
			if (error) handleSupabaseError(error);

			const counts: OrderStageCounts = {
				orders: 0,
				main: 0,
				call: 0,
				booking: 0,
				archive: 0,
				callUniqueVehicles: 0,
			};

			for (const row of data ?? []) {
				const stage = row.stage as OrderStage | null;
				if (stage && stage in counts) {
					counts[
						stage as Exclude<keyof OrderStageCounts, "callUniqueVehicles">
					] = Number(row.row_count) || 0;
				}
				if (stage === "call") {
					counts.callUniqueVehicles = Number(row.call_unique_vehicles) || 0;
				}
			}

			return counts;
		},

		async checkHistoricalVinPartDuplicate(
			vin: string,
			partNumber: string,
			excludeIds?: string | string[],
		): Promise<DuplicateCheckResult> {
			if (!vin || !partNumber) {
				return { isDuplicate: false };
			}

			const normalizedVin = vin.trim().toUpperCase();
			const normalizedPart = partNumber.trim().toUpperCase();

			if (normalizedVin.length < 6 || !normalizedPart) {
				return { isDuplicate: false };
			}

			const excludeSet = new Set(
				Array.isArray(excludeIds) ? excludeIds : excludeIds ? [excludeIds] : [],
			);

			const { result, error } = await scanPages<
				{
					id: string;
					vin: string | null;
					stage: string | null;
					metadata: unknown;
				},
				DuplicateCheckResult
			>(
				(from, to) =>
					db
						.from("orders")
						.select("id, vin, stage, metadata")
						.ilike("vin", escapeLikePattern(normalizedVin))
						.filter(
							"metadata->>partNumber",
							"ilike",
							escapeLikePattern(normalizedPart),
						)
						.order("id")
						.range(from, to),
				(row) => {
					if (excludeSet.has(row.id)) return undefined;

					const rowPart = (row.metadata as Record<string, unknown>)
						?.partNumber as string | undefined;
					if (rowPart?.toUpperCase() === normalizedPart) {
						return {
							isDuplicate: true,
							existingRow: {
								id: row.id,
								vin: row.vin || "",
								stage: row.stage,
							} as PendingRow,
							location: row.stage || "history",
						};
					}
					return undefined;
				},
			);

			if (error) handleSupabaseError(error);

			return result ?? { isDuplicate: false };
		},

		async checkHistoricalDescriptionConflict(
			partNumber: string,
			currentDescription: string,
			currentRowId?: string,
		): Promise<DescriptionConflictResult> {
			if (!partNumber || !currentDescription) {
				return { hasConflict: false };
			}

			const normalizedPart = partNumber.trim().toUpperCase();
			const normalizedDesc = currentDescription.trim().toLowerCase();

			const { result, error } = await scanPages<
				{
					id: string;
					vin: string | null;
					stage: string | null;
					metadata: unknown;
				},
				DescriptionConflictResult
			>(
				(from, to) =>
					db
						.from("orders")
						.select("id, vin, stage, metadata")
						.filter(
							"metadata->>partNumber",
							"ilike",
							escapeLikePattern(normalizedPart),
						)
						.order("id")
						.range(from, to),
				(row) => {
					if (currentRowId && row.id === currentRowId) return undefined;

					const rowPart = (row.metadata as Record<string, unknown>)
						?.partNumber as string | undefined;
					const rowDesc = (row.metadata as Record<string, unknown>)
						?.description as string | undefined;

					if (
						rowPart?.toUpperCase() === normalizedPart &&
						rowDesc?.trim().toLowerCase() !== normalizedDesc
					) {
						return {
							hasConflict: true,
							existingDescription: rowDesc,
							existingRow: {
								id: row.id,
								vin: row.vin || "",
								stage: row.stage,
							} as PendingRow,
						};
					}
					return undefined;
				},
			);

			if (error) handleSupabaseError(error);

			return result ?? { hasConflict: false };
		},
	};
}
