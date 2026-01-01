import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, type OrderStage } from "@/services/orderService";
import { toast } from "sonner";

export function useOrdersQuery(stage?: OrderStage) {
    return useQuery({
        queryKey: ["orders", stage],
        queryFn: async () => {
            const data = await orderService.getOrders(stage);
            return data.map(orderService.mapSupabaseOrder);
        },
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
        onError: (error: any) => {
            toast.error(`Failed to update stage: ${error.message}`);
        },
    });
}

export function useSaveOrderMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (order: any) => orderService.saveOrder(order),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error: any) => {
            toast.error(`Error saving order: ${error.message}`);
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
