import { createAppQueryClient } from "@/lib/queryClient";

/**
 * Shared QueryClient for the test suite.
 *
 * Production no longer exports a module-level `queryClient` singleton (each
 * `QueryProvider` mount owns an isolated client — see MAH-38). Tests still need
 * a single client they can seed via `queryClient.setQueryData(...)` and that the
 * `OrdersQueryAdapter` (wired in `test/setup.ts`) reads from. This module
 * provides exactly that, built with the same config factory as production.
 */
export const queryClient = createAppQueryClient();
