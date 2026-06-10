import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { OrderStage } from "@/domain/order/orderStage";
import { OrderMappingError } from "@/lib/errors";
import { orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

export function useOrdersQuery(
	stage?: OrderStage,
	options?: { enabled?: boolean },
): UseQueryResult<PendingRow[], Error> {
	return useQuery<PendingRow[]>({
		queryKey: ["orders", stage],
		queryFn: async (): Promise<PendingRow[]> => {
			const data = await orderService.getOrders(stage);
			if (!data) return [];
			try {
				return data.map((row) =>
					orderService.mapSupabaseOrder(row as Record<string, unknown>),
				);
			} catch (err) {
				if (err instanceof OrderMappingError) throw err;
				throw new OrderMappingError(
					`Unexpected mapping failure: ${String(err)}`,
				);
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		...(options || {}),
	});
}
