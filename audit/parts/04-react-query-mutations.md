# Audit Report: React Query & Mutations (A04)

This report details the security, architecture, performance, and correctness findings identified within the `src/hooks/queries/**`, mutation hooks, and `src/lib/queryClient.ts` files of the `pendingsystem` codebase.

---

### [A04-1] Stale Dashboard Stats Count Cache Leak
- **Severity**: High
- **Category**: Correctness/Bug
- **Location**: `src/hooks/queries/useDashboardStatsQuery.ts:16`
- **Evidence**:
  ```ts
  // In src/hooks/queries/useDashboardStatsQuery.ts:
  export function useDashboardStatsQuery(): UseQueryResult<
  	DashboardStatRow[],
  	Error
  > {
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
  ```
- **Why it's real**:
  The dashboard stage counts are fetched and cached via the query key `["dashboard-stats"]` with a `staleTime` of 5 minutes. However, none of the mutation hooks (`useSaveOrderMutation`, `useBulkUpdateOrderStageMutation`, `useBulkDeleteOrdersMutation`), the realtime sync subscription (`useOrdersRealtimeSync`), or the automated warranty maintenance loop (`useWarrantyExpiryMaintenance`) invalidate the `["dashboard-stats"]` query key when orders are created, updated, deleted, or shifted between stages. As a result, the counts displayed on the dashboard will remain stale and incorrect for up to 5 minutes after user mutations or background syncs occur.
- **Recommendation**: Update the mutation hooks, realtime sync insert handlers, and the warranty maintenance loop to invalidate the `["dashboard-stats"]` query key on success/settle.
- **Confidence**: High

---

### [A04-2] Stage Transition Optimistic Update and Rollback Failures
- **Severity**: Medium
- **Category**: Correctness/Bug
- **Location**: `src/hooks/queries/useSaveOrderMutation.ts:43-61`
- **Evidence**:
  ```ts
  onMutate: async ({ id, updates, stage }) => {
  	await queryClient.cancelQueries({ queryKey: ["orders"] });

  	const cacheKey = getOrdersQueryKey(stage);
  	const previousRows = queryClient.getQueryData<PendingRow[]>(cacheKey);
  	const previousOrdersCache: OrdersCacheSnapshot = {
  		[stage]: previousRows,
  	};

  	if (previousRows) {
  		queryClient.setQueryData<PendingRow[]>(cacheKey, (oldOrders = []) =>
  			oldOrders.map((order) =>
  				order.id === id ? { ...order, ...updates } : order,
  			),
  		);
  	}

  	return { previousOrdersCache };
  }
  ```
- **Why it's real**:
  When updating an order that involves moving it to a different stage (i.e. `sourceStage` is provided and `sourceStage !== stage`), the order resides in the `sourceStage` cache and does not yet exist in the destination `stage` cache.
  1. `previousRows` retrieves the destination stage's cache (`stage`), which does not contain the order. As a result, the `.map()` replacement does nothing, and the item is not optimistically added/moved to the destination stage.
  2. The item is not optimistically removed from the `sourceStage` cache during `onMutate`.
  3. The `sourceStage` cache is not snapshotted in `previousOrdersCache`, resulting in a lack of rollback safety for that stage if the server mutation fails.
  This causes the UI to lag: the item remains in the source grid and fails to appear in the destination grid until the API request resolves.
- **Recommendation**: Rewrite `onMutate` in `useSaveOrderMutation` to detect stage changes. If a stage change is detected: snapshot both the source and destination stage caches, optimistically remove the order from the source cache, and prepend/insert the updated order in the destination cache.
- **Confidence**: High

---

### [A04-3] Global `queryClient` Singleton Direct Import and Synchronous Reads in Components
- **Severity**: Medium
- **Category**: Architecture
- **Location**: `src/components/shared/Header.tsx:30`, `src/components/shared/Sidebar.tsx:29`
- **Evidence**:
  ```ts
  // Header.tsx:
  import { queryClient } from "@/lib/queryClient";
  ...
  queryClient.getQueryState(...)

  // Sidebar.tsx:
  import { getOrdersByStageFromCache } from "@/lib/queryClient";
  ...
  const targetRow = getOrdersByStageFromCache("orders").find(...)
  ```
- **Why it's real**:
  Directly importing the global `queryClient` singleton in client components violates React Query architecture (which dictates accessing the client via the `useQueryClient` hook/context).
  1. In SSR/Next.js systems, using a module-level global singleton can cause cross-request state pollution during server-side rendering.
  2. Calling synchronous cache read helpers (like `getOrdersByStageFromCache`) inside component render cycles does not subscribe the component to query cache updates. If the cache updates, the component does not re-render, causing stale logic checks (e.g. blocking or failing to block navigation on active edits).
  3. It hinders unit testing because components are coupled to a single shared query client rather than the mock or isolated query client injected by the test runner.
- **Recommendation**:
  1. Replace all direct imports of the global `queryClient` singleton in client components with the `useQueryClient()` hook.
  2. Replace synchronous cache reads during render cycles with standard reactive `useQuery`/`useOrdersQuery` hook queries to ensure components correctly re-render when the cache changes.
- **Confidence**: High

---

### [A04-4] Hardcoded Stage Query Key in `useOrdersQuery`
- **Severity**: Low
- **Category**: Architecture
- **Location**: `src/hooks/queries/useOrdersQuery.ts:12`
- **Evidence**:
  ```ts
  // useOrdersQuery.ts
  queryKey: ["orders", stage],
  ```
- **Why it's real**:
  Instead of using the centralized query key getter `getOrdersQueryKey(stage)` exported by `src/lib/queryClient.ts`, `useOrdersQuery` hardcodes the query key array `["orders", stage]`. This is an architectural violation of key centralization, increasing the risk of structural queries getting out of sync if key formats are changed.
- **Recommendation**: Import and use `getOrdersQueryKey(stage)` to specify the query key.
- **Confidence**: High
