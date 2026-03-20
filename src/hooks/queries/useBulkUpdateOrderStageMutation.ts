import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type BulkStageContext,
	getErrorMessage,
	getMovedRowsById,
	type OrdersCacheSnapshot,
	restoreOrdersCache,
} from "@/lib/queryCacheHelpers";
import { getOrdersQueryKey, ORDER_STAGES } from "@/lib/queryClient";
import { type OrderStage, orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

type BulkUpdateStageVariables = {
	ids: string[];
	stage: OrderStage;
	silentErrorToast?: boolean;
};

/**
 * Hook to bulk update order stages.
 * Performs optimistic updates across stages during onMutate by extracting rows from their
 * origin stage and inserting them into the destination stage cache. Backs up affected
 * caches to an OrdersCacheSnapshot to allow rollback via restoreOrdersCache in onError.
 * Dispatches cache invalidations for affected query keys onSettled.
 */
export function useBulkUpdateOrderStageMutation(sourceStage: OrderStage) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["bulk-update-stage", sourceStage],
		mutationFn: ({ ids, stage }: BulkUpdateStageVariables) =>
			orderService.updateOrdersStage(ids, stage),
		onMutate: async ({ ids, stage }) => {
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			const previousOrdersCache: OrdersCacheSnapshot = {};
			for (const cacheStage of ORDER_STAGES) {
				previousOrdersCache[cacheStage] = queryClient.getQueryData<
					PendingRow[]
				>(getOrdersQueryKey(cacheStage));
			}

			const movedRowsById = new Map<string, PendingRow>();
			const idSet = new Set(ids);
			const touchedStages = new Set<OrderStage>();

			for (const cacheStage of ORDER_STAGES) {
				const previousRows = previousOrdersCache[cacheStage];
				const remainingRows = getMovedRowsById(
					previousRows,
					idSet,
					stage,
					movedRowsById,
				);

				if (
					previousRows &&
					remainingRows &&
					remainingRows.length !== previousRows.length
				) {
					touchedStages.add(cacheStage);
					queryClient.setQueryData(
						getOrdersQueryKey(cacheStage),
						remainingRows,
					);
				}
			}

			const movedRows = Array.from(movedRowsById.values());
			if (movedRows.length > 0) {
				touchedStages.add(stage);
				queryClient.setQueryData<PendingRow[]>(
					getOrdersQueryKey(stage),
					(oldRows = []) => {
						const existingIds = new Set(oldRows.map((row) => row.id));
						const newRows = movedRows.filter((row) => !existingIds.has(row.id));
						return [...newRows, ...oldRows];
					},
				);
			}

			return {
				previousOrdersCache,
				touchedStages: Array.from(touchedStages),
				destinationStage: stage,
			} as BulkStageContext;
		},
		onError: (error, variables, context) => {
			if (context?.previousOrdersCache) {
				restoreOrdersCache(queryClient, context.previousOrdersCache);
			}
			if (!variables.silentErrorToast) {
				toast.error(`Failed to move orders: ${getErrorMessage(error)}`);
			}
		},
		onSettled: async (_data, _error, variables, context) => {
			const stagesToRefresh = new Set<OrderStage>(
				context?.touchedStages ?? [variables.stage],
			);
			if (context?.destinationStage) {
				stagesToRefresh.add(context.destinationStage);
			}

			await Promise.all(
				Array.from(stagesToRefresh).map((stage) =>
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) }),
				),
			);
		},
	});
}
