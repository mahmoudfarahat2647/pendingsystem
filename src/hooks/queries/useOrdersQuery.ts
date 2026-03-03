import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { type OrderStage, orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

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

// Re-export mutations for backwards compatibility with existing imports
export { useBulkUpdateOrderStageMutation } from "./useBulkUpdateOrderStageMutation";
export { useSaveOrderMutation } from "./useSaveOrderMutation";
export { useBulkDeleteOrdersMutation } from "./useBulkDeleteOrdersMutation";
