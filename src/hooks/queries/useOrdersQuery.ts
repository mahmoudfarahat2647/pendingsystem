import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrdersQueryKey, ORDER_STAGES } from "@/lib/queryClient";
import { type OrderStage, orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

type OrdersCacheSnapshot = Partial<
	Record<OrderStage, PendingRow[] | undefined>
>;

interface BulkStageContext {
	previousOrdersCache: OrdersCacheSnapshot;
	touchedStages: OrderStage[];
	destinationStage: OrderStage;
}

interface DeleteContext {
	previousOrdersCache: OrdersCacheSnapshot;
	touchedStages: OrderStage[];
}

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "object" && error) {
		const err = error as Record<string, unknown>;
		if (typeof err.message === "string") return err.message;
		if (typeof err.hint === "string") return err.hint;
		if (typeof err.details === "string") return err.details;
	}

	return String(error);
};

const getMovedRowsById = (
	rows: PendingRow[] | undefined,
	idSet: Set<string>,
	destinationStage: OrderStage,
	collector: Map<string, PendingRow>,
) => {
	if (!rows) {
		return rows;
	}

	return rows.filter((row) => {
		if (!idSet.has(row.id)) {
			return true;
		}

		collector.set(row.id, { ...row, stage: destinationStage });
		return false;
	});
};

export function useOrdersQuery(
	stage?: OrderStage,
): UseQueryResult<PendingRow[], Error> {
	return useQuery<PendingRow[]>({
		queryKey: ["orders", stage],
		queryFn: async (): Promise<PendingRow[]> => {
			const data = await orderService.getOrders(stage);
			if (!data) return [];
			return data
				.map((row) =>
					orderService.mapSupabaseOrder(row as Record<string, unknown>),
				)
				.filter((row): row is PendingRow => row !== null);
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
	});
}

export function useBulkUpdateOrderStageMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ ids, stage }: { ids: string[]; stage: OrderStage }) =>
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
		onError: (error, _variables, context) => {
			if (context?.previousOrdersCache) {
				for (const stage of ORDER_STAGES) {
					queryClient.setQueryData(
						getOrdersQueryKey(stage),
						context.previousOrdersCache[stage],
					);
				}
			}
			toast.error(`Failed to move orders: ${getErrorMessage(error)}`);
		},
		onSettled: async (_data, _error, variables, context) => {
			const stagesToRefresh = new Set<OrderStage>(
				context?.touchedStages ?? [variables.stage],
			);
			stagesToRefresh.add(context?.destinationStage ?? variables.stage);

			await Promise.all(
				Array.from(stagesToRefresh).map((stage) =>
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) }),
				),
			);
		},
	});
}

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
			await queryClient.cancelQueries({ queryKey: getOrdersQueryKey(stage) });

			const previousOrders = queryClient.getQueryData<PendingRow[]>(
				getOrdersQueryKey(stage),
			);

			if (previousOrders) {
				queryClient.setQueryData<PendingRow[]>(
					getOrdersQueryKey(stage),
					(oldOrders = []) =>
						oldOrders.map((order) =>
							order.id === id ? { ...order, ...updates } : order,
						),
				);
			}

			return { previousOrders };
		},
		onError: (
			error,
			variables,
			context?: { previousOrders?: PendingRow[] },
		) => {
			if (context?.previousOrders) {
				queryClient.setQueryData(
					getOrdersQueryKey(variables.stage),
					context.previousOrders,
				);
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

export function useDeleteOrderMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => orderService.deleteOrder(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			const previousOrdersCache: OrdersCacheSnapshot = {};
			const touchedStages: OrderStage[] = [];

			for (const stage of ORDER_STAGES) {
				const cacheKey = getOrdersQueryKey(stage);
				const previousRows = queryClient.getQueryData<PendingRow[]>(cacheKey);
				previousOrdersCache[stage] = previousRows;

				if (!previousRows) continue;

				const nextRows = previousRows.filter((row) => row.id !== id);
				if (nextRows.length !== previousRows.length) {
					touchedStages.push(stage);
					queryClient.setQueryData(cacheKey, nextRows);
				}
			}

			return { previousOrdersCache, touchedStages } as DeleteContext;
		},
		onError: (error, _id, context) => {
			if (context?.previousOrdersCache) {
				for (const stage of ORDER_STAGES) {
					queryClient.setQueryData(
						getOrdersQueryKey(stage),
						context.previousOrdersCache[stage],
					);
				}
			}
			toast.error(`Failed to delete order: ${getErrorMessage(error)}`);
		},
		onSuccess: () => {
			toast.success("Order deleted");
		},
		onSettled: async (_data, _error, _id, context) => {
			const stagesToRefresh = context?.touchedStages ?? ORDER_STAGES;
			await Promise.all(
				stagesToRefresh.map((stage) =>
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) }),
				),
			);
		},
	});
}

export function useBulkDeleteOrdersMutation() {
	const queryClient = useQueryClient();

	return useMutation({
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
				for (const stage of ORDER_STAGES) {
					queryClient.setQueryData(
						getOrdersQueryKey(stage),
						context.previousOrdersCache[stage],
					);
				}
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
