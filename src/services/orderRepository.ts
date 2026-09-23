import { isUuid } from "@/domain/order/orderWorkflow";
import { logger } from "@/lib/logger";
import { supabase as supabaseDefault } from "@/lib/supabase";
import type { PendingRow } from "@/types";
import { createOrderSaveRepository } from "./order/orderSaveRepository";
import { createOrderStageTransitionRepository } from "./order/orderStageTransitionRepository";
import { mapSupabaseOrder } from "./orderMapper";
import { handleSupabaseError } from "./orderServiceErrors";

export function createOrderRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	const service = {
		...createOrderStageTransitionRepository(db),
		...createOrderSaveRepository(db),

		async deleteOrder(id: string) {
			if (!id || !isUuid(id)) {
				logger.warn(`Skipping delete for non-UUID id: ${id}`);
				return;
			}

			const { error } = await db.from("orders").delete().eq("id", id);
			if (error) handleSupabaseError(error);
		},

		async deleteOrders(ids: string[]) {
			if (ids.length === 0) return;

			const validIds = ids.filter(isUuid);
			if (validIds.length === 0) {
				logger.warn("Skipping bulk delete; no valid UUID ids", {
					count: ids.length,
				});
				return;
			}

			if (validIds.length !== ids.length) {
				logger.warn("Skipping non-UUID ids during bulk delete", {
					totalIds: ids.length,
					validIds: validIds.length,
				});
			}

			const { error } = await db.from("orders").delete().in("id", validIds);
			if (error) handleSupabaseError(error);
		},

		mapSupabaseOrder(row: Record<string, unknown>): PendingRow {
			return mapSupabaseOrder(row);
		},
	};
	return service;
}
