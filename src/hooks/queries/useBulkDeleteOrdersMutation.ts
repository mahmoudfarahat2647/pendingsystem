import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type DeleteContext,
	getErrorMessage,
	type OrdersCacheSnapshot,
	restoreOrdersCache,
} from "@/lib/queryCacheHelpers";
import { getOrdersQueryKey, ORDER_STAGES } from "@/lib/queryClient";
import { type OrderStage, orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

/**
 * Hook to bulk delete orders.
 * During onMutate, iterates all order stages and optimistically removes matching orders
 * from each, backing up pre-update state into OrdersCacheSnapshot. Rolls back via
 * restoreOrdersCache if an error occurs. Invalidates touched queried onSettled.
 */
export function useBulkDeleteOrdersMutation(sourceStage: OrderStage) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["bulk-delete-orders", sourceStage],
		mutationFn: (ids: string[]) => orderService.deleteOrders(ids),
		onMutate: async (ids) => {
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			const idSet = new Set(ids);
			const previousOrdersCache: OrdersCacheSnapshot = {};
			const touchedStages: OrderStage[] = [];

			for (const stage of ORDER_STAGES) {
				const cacheKey = getOrdersQueryKey(stage);
				const previousRows = queryClient.getQueryData<PendingRow[]>(cacheKey);
				previousOrdersCache[stage] = previousRows;

				if (!previousRows) continue;

				const nextRows = previousRows.filter((row) => !idSet.has(row.id));
				if (nextRows.length !== previousRows.length) {
					touchedStages.push(stage);
					queryClient.setQueryData(cacheKey, nextRows);
				}
			}

			return { previousOrdersCache, touchedStages } as DeleteContext;
		},
		onError: (error, _ids, context) => {
			if (context?.previousOrdersCache) {
				restoreOrdersCache(queryClient, context.previousOrdersCache);
			}
			toast.error(`Failed to delete orders: ${getErrorMessage(error)}`);
		},
		onSettled: async (_data, _error, _ids, context) => {
			const stagesToRefresh = context?.touchedStages ?? ORDER_STAGES;
			await Promise.all(
				stagesToRefresh.map((stage) =>
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) }),
				),
			);
		},
	});
}
