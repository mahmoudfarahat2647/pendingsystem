import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type OrderStage, orderService } from "@/services/orderService";

export function useOrdersQuery(stage?: OrderStage) {
	return useQuery({
		queryKey: ["orders", stage],
		queryFn: async () => {
			const data = await orderService.getOrders(stage);
			return data.map(orderService.mapSupabaseOrder);
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
			// Cancel refetches
			await queryClient.cancelQueries({ queryKey: ["orders"] });

			// Snapshot current cache states for rollback
			const previousOrdersCache: Record<string, any[] | undefined> = {};
			const stages: OrderStage[] = ["orders", "main", "call", "booking", "archive"];

			for (const s of stages) {
				previousOrdersCache[s] = queryClient.getQueryData(["orders", s]);
			}

			// Optimistically move items between stages
			// We find which rows are being moved by looking at all caches
			const movedRows: any[] = [];
			const idSet = new Set(ids);

			// 1. Remove from all possible source caches and collect the rows
			for (const s of stages) {
				const data = previousOrdersCache[s];
				if (data) {
					const remaining = data.filter((row) => {
						if (idSet.has(row.id)) {
							movedRows.push({ ...row, stage }); // Update stage locally
							return false;
						}
						return true;
					});
					queryClient.setQueryData(["orders", s], remaining);
				}
			}

			// 2. Add to destination cache
			if (movedRows.length > 0) {
				queryClient.setQueryData(["orders", stage], (old: any[] | undefined) => {
					const base = old || [];
					return [...movedRows, ...base];
				});
			}

			return { previousOrdersCache };
		},
		onError: (error: any, _variables, context) => {
			// Rollback all affected caches
			if (context?.previousOrdersCache) {
				for (const [key, data] of Object.entries(context.previousOrdersCache)) {
					queryClient.setQueryData(["orders", key], data);
				}
			}
			const errorMessage =
				error?.message || error?.hint || error?.details || String(error);
			toast.error(`Failed to move orders: ${errorMessage}`);
		},
		onSettled: () => {
			// Invalidate everything to be safe
			queryClient.invalidateQueries({ queryKey: ["orders"] });
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
			// biome-ignore lint/suspicious/noExplicitAny: Updates object
			updates: any;
			stage: OrderStage;
		}) => orderService.saveOrder({ id, ...updates, stage }),
		onMutate: async ({ id, updates, stage }) => {
			// [CRITICAL] OPTIMISTIC UPDATE PATTERN
			// 1. Cancel outgoing refetches to prevent overwrite
			// 2. Snapshot current state for rollback
			// 3. Update cache instantly (creates new object reference for immutability)
			await queryClient.cancelQueries({ queryKey: ["orders", stage] });

			// Snapshot the previous value
			// biome-ignore lint/suspicious/noExplicitAny: Query data
			const previousOrders = queryClient.getQueryData<any[]>(["orders", stage]);

			// Optimistically update to the new value
			// Optimistically update to the new value
			// Optimistically update to the new value
			if (previousOrders) {
				// biome-ignore lint/suspicious/noExplicitAny: Query data
				queryClient.setQueryData<any[]>(["orders", stage], (old) => {
					if (!old) return [];
					return old.map((order) =>
						order.id === id ? { ...order, ...updates } : order,
					);
				});
			}

			return { previousOrders };
		},
		// biome-ignore lint/suspicious/noExplicitAny: Error handling
		onSuccess: (data, variables) => {
			if (data) {
				const mappedOrder = orderService.mapSupabaseOrder(data);
				queryClient.setQueryData<any[]>(
					["orders", variables.stage],
					(old) => {
						if (!old) return [];
						return old.map((order) =>
							order.id === mappedOrder.id ? mappedOrder : order,
						);
					},
				);
			}
		},
		onError: (error: any, variables, context) => {
			if (context?.previousOrders) {
				queryClient.setQueryData(
					["orders", variables.stage],
					context.previousOrders,
				);
			}
			const errorMessage =
				error?.message || error?.hint || error?.details || String(error);
			toast.error(`Error saving order: ${errorMessage}`);
		},
		onSettled: (_data, _error, { stage }) => {
			// [CRITICAL] CONSISTENCY INVALIDATION
			// Refetch only AFTER the UI has been updated via onMutate/onSuccess. 
			// Do NOT add delays here; the reactivity is handled by manual cache updates.
			queryClient.invalidateQueries({ queryKey: ["orders", stage] });
		},
	});
}

export function useDeleteOrderMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => orderService.deleteOrder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			toast.success("Order deleted");
		},
	});
}

export function useRecentActivityQuery() {
	return useQuery({
		queryKey: ["activity"],
		queryFn: () => orderService.getActivityLog(),
		refetchInterval: 30000, // Refresh every 30 seconds
	});
}
