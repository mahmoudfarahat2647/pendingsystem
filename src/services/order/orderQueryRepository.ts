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

export function createOrderQueryRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	return {
		async getOrders(stage?: OrderStage) {
			let query = db
				.from("orders")
				.select(ORDERS_SELECT_WITH_ATTACHMENTS)
				.order("created_at", { ascending: false });

			if (stage) {
				query = query.eq("stage", stage);
			}
			const { data, error } = await query;
			if (error && isMissingAttachmentColumnError(error)) {
				let fallbackQuery = db
					.from("orders")
					.select(ORDERS_SELECT_BASE)
					.order("created_at", { ascending: false });

				if (stage) {
					fallbackQuery = fallbackQuery.eq("stage", stage);
				}

				const { data: fallbackData, error: fallbackError } =
					await fallbackQuery;
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
			const { data, error } = await db.from("orders").select("id, vin, stage");
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
