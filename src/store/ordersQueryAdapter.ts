import type { QueryClient } from "@tanstack/react-query";
import { getOrdersQueryKey } from "@/lib/queryClient";
import type { OrderStage } from "@/services/orderService";
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
};

let registered: OrdersQueryAdapter = noopAdapter;
let registrationCount = 0;

export function setOrdersQueryAdapter(adapter: OrdersQueryAdapter): void {
	registrationCount += 1;
	if (registrationCount > 1 && process.env.NODE_ENV !== "production") {
		console.warn(
			"[ordersQueryAdapter] adapter registered more than once — last registration wins. " +
				"This is expected in tests, but indicates a wiring bug in production code.",
		);
	}
	registered = adapter;
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
	};
}

/** Test-only: reset the registered adapter to the no-op default. */
export function __resetOrdersQueryAdapterForTests(): void {
	registered = noopAdapter;
	registrationCount = 0;
}
