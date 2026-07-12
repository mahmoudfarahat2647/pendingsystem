import { QueryClient } from "@tanstack/react-query";
import type { OrderStage } from "@/domain/order/orderStage";

export const getOrdersQueryKey = (stage: OrderStage) =>
	["orders", stage] as const;

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard-stats"] as const;

export const NOTIFICATION_CANDIDATES_QUERY_KEY = [
	"notifications",
	"candidates",
] as const;

/**
 * Creates a fresh, isolated `QueryClient`.
 *
 * A new instance is created per `QueryProvider` mount (see
 * `src/components/providers/QueryProvider.tsx`) rather than exporting a
 * module-level singleton. In the Next.js App Router a module-level cache is
 * shared across every incoming server request, so a singleton would leak one
 * user's cached query data into another request once server-side prefetching is
 * introduced. Keeping creation in a factory gives each request/session an
 * isolated cache.
 */
export function createAppQueryClient(): QueryClient {
	return new QueryClient({
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
}
