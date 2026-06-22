import { QueryClient } from "@tanstack/react-query";
import type { OrderStage } from "@/domain/order/orderStage";

export const getOrdersQueryKey = (stage: OrderStage) =>
	["orders", stage] as const;

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard-stats"] as const;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			retry: 1,
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		},
	},
});
