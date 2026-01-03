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

export function useUpdateOrderStageMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, stage }: { id: string; stage: OrderStage }) =>
			orderService.updateOrderStage(id, stage),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			toast.success("Order stage updated");
		},
		// biome-ignore lint/suspicious/noExplicitAny: Error handling
		onError: (error: any) => {
			const errorMessage =
				error?.message || error?.hint || error?.details || String(error);
			toast.error(`Failed to update stage: ${errorMessage}`);
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
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
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
		onError: (error: any, _variables, context) => {
			if (context?.previousOrders) {
				queryClient.setQueryData(["orders"], context.previousOrders);
			}
			const errorMessage =
				error?.message || error?.hint || error?.details || String(error);
			toast.error(`Error saving order: ${errorMessage}`);
		},
		onSettled: (_data, _error, { stage }) => {
			// Delay invalidation slightly to ensure DB propagation and prevent
			// reading stale data that overwrites our optimistic update
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ["orders", stage] });
			}, 500);
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
