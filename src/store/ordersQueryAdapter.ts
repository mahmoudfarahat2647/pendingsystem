import type { QueryClient } from "@tanstack/react-query";
import type { OrderStage } from "@/domain/order/orderStage";
import { logger } from "@/lib/logger";
import {
	getOrdersQueryKey,
	NOTIFICATION_CANDIDATES_QUERY_KEY,
} from "@/lib/queryClient";
import type { PendingRow } from "@/types";

/**
 * Port exposed by the React Query infrastructure to the Zustand store.
 *
 * The store MUST NOT import `@tanstack/react-query` or `@/lib/queryClient`'s
 * `queryClient` singleton directly. Instead, the `QueryProvider` registers a
 * concrete adapter at module load and the store calls through this interface.
 *
 * This inverts the dependency direction so the inner state layer no longer
 * depends on the outer framework layer. See `architecture-audit.md` finding H1.
 */
export interface OrdersQueryAdapter {
	getStageRows: (stage: OrderStage) => PendingRow[] | undefined;
	isStageLoaded: (stage: OrderStage) => boolean;
	invalidateStage: (stage: OrderStage) => void;
	getDueNotificationCandidates: () => PendingRow[] | undefined;
	isDueCandidatesLoaded: () => boolean;
}

/**
 * No-op default. Used when the adapter has not been registered yet — typically
 * during SSR or before `QueryProvider` has loaded. Mirrors today's behavior
 * when `queryClient.getQueryData(...)` returns `undefined` and `invalidateQueries`
 * finds no observers.
 */
const noopAdapter: OrdersQueryAdapter = {
	getStageRows: () => undefined,
	isStageLoaded: () => false,
	invalidateStage: () => {},
	getDueNotificationCandidates: () => undefined,
	isDueCandidatesLoaded: () => false,
};

let registered: OrdersQueryAdapter = noopAdapter;
let registrationCount = 0;

export function setOrdersQueryAdapter(adapter: OrdersQueryAdapter): void {
	registrationCount += 1;
	if (registrationCount > 1 && process.env.NODE_ENV !== "production") {
		logger.warn(
			"[ordersQueryAdapter] adapter registered more than once — last registration wins. " +
				"This is expected in tests, but indicates a wiring bug in production code.",
		);
	}
	registered = adapter;
}

/**
 * Tears down the current registration, restoring the no-op default.
 *
 * Paired with `setOrdersQueryAdapter` as the cleanup half of a React effect so
 * the registration is symmetric across mount/unmount. This also keeps
 * `registrationCount` balanced under React StrictMode, which double-invokes
 * effects (setup -> cleanup -> setup) on mount in development — without the
 * decrement here that dev-only replay would falsely trip the
 * "registered more than once" warning below.
 */
export function clearOrdersQueryAdapter(): void {
	registrationCount = Math.max(0, registrationCount - 1);
	registered = noopAdapter;
}

export function getOrdersQueryAdapter(): OrdersQueryAdapter {
	return registered;
}

/**
 * Factory used by both `QueryProvider` (production) and `test/setup.ts` (tests)
 * so that the wiring logic is identical in both environments.
 */
export function createReactQueryAdapter(
	queryClient: QueryClient,
): OrdersQueryAdapter {
	return {
		getStageRows: (stage) =>
			queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)),
		isStageLoaded: (stage) =>
			queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)) !==
			undefined,
		invalidateStage: (stage) => {
			queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) });
		},
		getDueNotificationCandidates: () =>
			queryClient.getQueryData<PendingRow[]>(NOTIFICATION_CANDIDATES_QUERY_KEY),
		isDueCandidatesLoaded: () =>
			queryClient.getQueryData<PendingRow[]>(
				NOTIFICATION_CANDIDATES_QUERY_KEY,
			) !== undefined,
	};
}
