import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { DASHBOARD_STATS_QUERY_KEY } from "@/lib/queryClient";
import { orderService } from "@/services/orderService";
import type { OrderStageCounts } from "@/types";

export function useDashboardStatsQuery(): UseQueryResult<
	OrderStageCounts,
	Error
> {
	return useQuery<OrderStageCounts>({
		queryKey: DASHBOARD_STATS_QUERY_KEY,
		queryFn: (): Promise<OrderStageCounts> => orderService.getDashboardStats(),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
	});
}
