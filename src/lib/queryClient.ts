import { QueryClient } from "@tanstack/react-query";
import type { OrderStage } from "@/services/orderService";
import type { PendingRow } from "@/types";

export const ORDER_STAGES: OrderStage[] = [
	"orders",
	"main",
	"call",
	"booking",
	"archive",
];

export const getOrdersQueryKey = (stage: OrderStage) =>
	["orders", stage] as const;

export const getOrdersByStageFromCache = (stage: OrderStage): PendingRow[] => {
	const rows = queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage));
	return rows ?? [];
};

export const isStageCacheLoaded = (stage: OrderStage): boolean => {
	return (
		queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)) !==
		undefined
	);
};

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
