import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	getErrorMessage,
	type OrdersCacheSnapshot,
	restoreOrdersCache,
} from "@/lib/queryCacheHelpers";
import {
	DASHBOARD_STATS_QUERY_KEY,
	getOrdersQueryKey,
} from "@/lib/queryClient";
import { orderService } from "@/services/orderService";
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
			sourceStage,
			idempotencyKey,
		}: {
			id: string;
			updates: Partial<PendingRow>;
			stage: OrderStage;
			sourceStage?: OrderStage;
			idempotencyKey?: string;
		}) =>
			orderService.saveOrder({
				id,
				...updates,
				stage,
				expectedCurrentStage: sourceStage,
				idempotencyKey,
			}),
		onMutate: async ({ id, updates, stage, sourceStage }) => {
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			const isStageTransition = !!sourceStage && sourceStage !== stage;
			const destCacheKey = getOrdersQueryKey(stage);
			const previousDestRows =
				queryClient.getQueryData<PendingRow[]>(destCacheKey);
			const previousOrdersCache: OrdersCacheSnapshot = {
				[stage]: previousDestRows,
			};

			if (isStageTransition) {
				const sourceCacheKey = getOrdersQueryKey(sourceStage);
				const previousSourceRows =
					queryClient.getQueryData<PendingRow[]>(sourceCacheKey);
				previousOrdersCache[sourceStage] = previousSourceRows;

				if (previousSourceRows) {
					// Optimistically remove from source stage
					queryClient.setQueryData<PendingRow[]>(
						sourceCacheKey,
						(oldOrders = []) => oldOrders.filter((order) => order.id !== id),
					);
					// Optimistically prepend merged row to destination stage
					const sourceRow = previousSourceRows.find((o) => o.id === id);
					if (sourceRow) {
						queryClient.setQueryData<PendingRow[]>(
							destCacheKey,
							(oldOrders = []) => [
								{ ...sourceRow, ...updates, stage },
								...oldOrders,
							],
						);
					}
				}
			} else {
				// Same-stage update — existing behavior
				if (previousDestRows) {
					queryClient.setQueryData<PendingRow[]>(
						destCacheKey,
						(oldOrders = []) =>
							oldOrders.map((order) =>
								order.id === id ? { ...order, ...updates } : order,
							),
					);
				}
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
			// Invalidate destination
			queryClient.invalidateQueries({
				queryKey: getOrdersQueryKey(variables.stage),
			});

			// If source differs, invalidate it too
			if (variables.sourceStage && variables.sourceStage !== variables.stage) {
				queryClient.invalidateQueries({
					queryKey: getOrdersQueryKey(variables.sourceStage),
				});
			}

			queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
		},
		onSuccess: (data, variables) => {
			let mappedRow: PendingRow;
			try {
				mappedRow = orderService.mapSupabaseOrder(
					data as Record<string, unknown>,
				);
			} catch {
				// Bad row from DB — onSettled invalidation will refetch correct data
				return;
			}
			// Handle multi-stage cache reconciliation
			if (variables.sourceStage && variables.sourceStage !== variables.stage) {
				const sourceCacheKey = getOrdersQueryKey(variables.sourceStage);
				queryClient.setQueryData<PendingRow[]>(
					sourceCacheKey,
					(oldOrders = []) =>
						oldOrders.filter((order) => order.id !== mappedRow.id),
				);
			}

			const cacheKey = getOrdersQueryKey(variables.stage);
			queryClient.setQueryData<PendingRow[]>(cacheKey, (oldOrders = []) => {
				const existingIndex = oldOrders.findIndex(
					(order) => order.id === mappedRow.id,
				);

				if (existingIndex === -1) {
					return [mappedRow, ...oldOrders];
				}

				return oldOrders.map((order) =>
					order.id === mappedRow.id ? { ...order, ...mappedRow } : order,
				);
			});
		},
	});
}
