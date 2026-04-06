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
			sourceStage,
		}: {
			id: string;
			updates: Partial<PendingRow>;
			stage: OrderStage;
			sourceStage?: OrderStage;
		}) =>
			orderService.saveOrder({
				id,
				...updates,
				stage,
				expectedCurrentStage: sourceStage,
			}),
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
		},
		onSuccess: (data, variables) => {
			const mappedRow = orderService.mapSupabaseOrder(
				data as Record<string, unknown>,
			);
			if (!mappedRow) {
				console.warn(
					"[useSaveOrderMutation] mapSupabaseOrder returned null — cache may be stale",
					data,
				);
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
