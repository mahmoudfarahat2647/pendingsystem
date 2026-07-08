import type { PostgrestError } from "@supabase/supabase-js";
import { OrderMappingError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type {
	DescriptionConflictResult,
	DuplicateCheckResult,
	OrderStage,
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

		async getDashboardStats() {
			// `.order("id")` gives the pagination loop a stable window; the rows
			// are only counted (unordered), so this has no UI impact.
			const { data, error } = await fetchAllPages<{
				id: string;
				vin: string | null;
				stage: string | null;
			}>((from, to) =>
				db.from("orders").select("id, vin, stage").order("id").range(from, to),
			);
			if (error) handleSupabaseError(error);
			return data;
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

			const { data, error } = await db
				.from("orders")
				.select("id, vin, stage, metadata")
				.ilike("vin", normalizedVin)
				.filter("metadata->>partNumber", "ilike", normalizedPart)
				.limit(100);

			if (error) {
				logger.warn(
					"[orderService] checkHistoricalVinPartDuplicate error:",
					error,
				);
				return { isDuplicate: false };
			}

			for (const row of data || []) {
				if (excludeSet.has(row.id)) continue;

				const rowPart = (row.metadata as Record<string, unknown>)?.partNumber as
					| string
					| undefined;
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
			}

			return { isDuplicate: false };
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

			const { data, error } = await db
				.from("orders")
				.select("id, vin, stage, metadata")
				.filter("metadata->>partNumber", "ilike", normalizedPart)
				.limit(100);

			if (error) {
				logger.warn(
					"[orderService] checkHistoricalDescriptionConflict error:",
					error,
				);
				return { hasConflict: false };
			}

			for (const row of data || []) {
				if (currentRowId && row.id === currentRowId) continue;

				const rowPart = (row.metadata as Record<string, unknown>)?.partNumber as
					| string
					| undefined;
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
			}

			return { hasConflict: false };
		},
	};
}
