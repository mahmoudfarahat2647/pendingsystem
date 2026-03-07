import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	getErrorMessage,
	type OrdersCacheSnapshot,
	restoreOrdersCache,
} from "@/lib/queryCacheHelpers";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { type OrderStage, orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

/**
 * Hook to save individual order updates.
 * Optimistically applies the updates to the order within its matching stage cache.
 * Uses queryCacheHelpers to backup and restore cache to guarantee consistency
 * in the event of an error. Invalidates the specific stage cache onSettled.
 */
export function useSaveOrderMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			updates,
			stage,
		}: {
			id: string;
			updates: Partial<PendingRow>;
			stage: OrderStage;
		}) => orderService.saveOrder({ id, ...updates, stage }),
		onMutate: async ({ id, updates, stage }) => {
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			const cacheKey = getOrdersQueryKey(stage);
			const previousRows = queryClient.getQueryData<PendingRow[]>(cacheKey);
			const previousOrdersCache: OrdersCacheSnapshot = {
				[stage]: previousRows,
			};

			if (previousRows) {
				queryClient.setQueryData<PendingRow[]>(cacheKey, (oldOrders = []) =>
					oldOrders.map((order) =>
						order.id === id ? { ...order, ...updates } : order,
					),
				);
			}

			return { previousOrdersCache };
		},
		onError: (error, _variables, context) => {
			if (context?.previousOrdersCache) {
				restoreOrdersCache(queryClient, context.previousOrdersCache);
			}
			toast.error(`Error saving order: ${getErrorMessage(error)}`);
		},
		onSettled: (_data, _error, variables) => {
			queryClient.invalidateQueries({
				queryKey: getOrdersQueryKey(variables.stage),
			});
		},
		onSuccess: (_, variables) => {
			void variables;
		},
	});
}
