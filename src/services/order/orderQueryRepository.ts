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

function mapOrderRows(
	data: Record<string, unknown>[] | null,
	operation: string,
): PendingRow[] {
	if (!data) return [];
	try {
		return data.map((row) => mapSupabaseOrder(row));
	} catch (err) {
		if (err instanceof OrderMappingError) throw err;
		throw new OrderMappingError(
			`Unexpected mapping failure in ${operation}: ${String(err)}`,
		);
	}
}

export function createOrderQueryRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	// Shared raw-row fetch behind getOrders and the filtered warranty
	// candidate fetch (#250). When `repairSystem` is absent the query shape
	// is exactly the historical getOrders shape; when present, an additional
	// server-side `metadata->>repairSystem` equality narrows the result set
	// before any row reaches Node.js.
	type WarrantyExpiryFilter =
		| { kind: "explicit-end"; before: string }
		| { kind: "fallback-start"; beforeOrOn: string };

	async function fetchRawOrders(
		stage?: OrderStage,
		repairSystem?: string,
		warrantyExpiry?: WarrantyExpiryFilter,
	) {
		// A secondary `.order("id")` tiebreak is required so pages don't skip
		// or duplicate rows when `created_at` values tie at a page boundary.
		// #248: served by orders_stage_created_at_id_idx on
		// orders(stage, created_at DESC, id ASC).
		const makePage =
			<S extends string>(select: S) =>
			(from: number, to: number) => {
				let q = db.from("orders").select(select);
				if (stage) {
					q = q.eq("stage", stage);
				}
				if (repairSystem) {
					q = q.filter("metadata->>repairSystem", "eq", repairSystem);
				}
				if (warrantyExpiry?.kind === "explicit-end") {
					q = q
						.not("metadata->>endWarranty", "is", null)
						.filter("metadata->>endWarranty", "neq", "")
						.or(
							`metadata->>endWarranty.lt.${warrantyExpiry.before},metadata->>endWarranty.not.like.____-__-__`,
						);
				}
				if (warrantyExpiry?.kind === "fallback-start") {
					q = q
						.or("metadata->>endWarranty.is.null,metadata->>endWarranty.eq.")
						.not("metadata->>startWarranty", "is", null)
						.filter("metadata->>startWarranty", "neq", "")
						.filter(
							"metadata->>startWarranty",
							"lte",
							warrantyExpiry.beforeOrOn,
						);
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
			const { data: fallbackData, error: fallbackError } = await fetchAllPages(
				makePage(ORDERS_SELECT_BASE),
			);
			if (fallbackError) handleSupabaseError(fallbackError);
			return fallbackData;
		}
		if (error) handleSupabaseError(error);
		return data;
	}

	return {
		async getOrders(stage?: OrderStage) {
			return fetchRawOrders(stage);
		},

		async fetchMappedOrders(stage: OrderStage): Promise<PendingRow[]> {
			const queryRepo = createOrderQueryRepository(db);
			const data = await queryRepo.getOrders(stage);
			return mapOrderRows(data, "fetchMappedOrders");
		},

		// #250: warranty-archival candidate fetch. repairSystem equality is
		// applied in the database so the sweep never loads full stage
		// datasets. When expiredAsOf is supplied, separate explicit-end and
		// fallback-start queries push a conservative expiry candidate filter
		// into PostgREST; the maintenance service still performs the exact
		// domain check before archiving.
		async fetchMappedOrdersByRepairSystem(
			stage: OrderStage,
			repairSystem: string,
			expiredAsOf?: Date,
		): Promise<PendingRow[]> {
			let data: Record<string, unknown>[] | null;
			if (expiredAsOf) {
				const formatLocalDate = (date: Date) =>
					[
						date.getFullYear(),
						String(date.getMonth() + 1).padStart(2, "0"),
						String(date.getDate()).padStart(2, "0"),
					].join("-");
				const warrantyStartCutoff = new Date(expiredAsOf);
				warrantyStartCutoff.setFullYear(warrantyStartCutoff.getFullYear() - 3);
				const [explicitEndRows, fallbackStartRows] = await Promise.all([
					fetchRawOrders(stage, repairSystem, {
						kind: "explicit-end",
						before: formatLocalDate(expiredAsOf),
					}),
					fetchRawOrders(stage, repairSystem, {
						kind: "fallback-start",
						beforeOrOn: formatLocalDate(warrantyStartCutoff),
					}),
				]);
				data = Array.from(
					new Map(
						[...(explicitEndRows ?? []), ...(fallbackStartRows ?? [])].map(
							(row) => [String(row.id), row],
						),
					).values(),
				);
			} else {
				data = await fetchRawOrders(stage, repairSystem);
			}
			return mapOrderRows(data, "fetchMappedOrdersByRepairSystem");
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
				freeze: 0,
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
						// #248: part-number prefilter stays ILIKE exact-match so it is
						// served by orders_partnumber_trgm_idx (GIN pg_trgm on
						// metadata->>'partNumber'). PostgREST (postgrest-js) only
						// filters on real columns / JSON-arrow paths, not upper(...)
						// expressions, so an upper() functional btree index can't
						// be addressed from this client query — deferred:
						// reintroduce with the RPC/direct-SQL upper()=equality
						// path. escapeLikePattern keeps the VIN ILIKE
						// literal (no active wildcards); the client-side
						// toUpperCase() recheck below preserves exact match
						// semantics.
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
						// #248: same index story as checkHistoricalVinPartDuplicate —
						// ILIKE exact-match served by orders_partnumber_trgm_idx
						// (GIN pg_trgm); an upper() functional btree index is
						// deferred (reintroduce with the RPC/direct-SQL upper()
						// equality path PostgREST can't express). Client-side
						// toUpperCase() recheck below keeps exact match semantics.
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
