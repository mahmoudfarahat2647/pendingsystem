import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { orderService, type OrderStage } from "@/services/orderService";

export interface DashboardStatRow {
    id: string;
    vin: string | null;
    stage: OrderStage | null;
}

export function useDashboardStatsQuery(): UseQueryResult<DashboardStatRow[], Error> {
    return useQuery<DashboardStatRow[]>({
        queryKey: ["dashboard-stats"],
        queryFn: async (): Promise<DashboardStatRow[]> => {
            const data = await orderService.getDashboardStats();
            return (data || []) as DashboardStatRow[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
}
