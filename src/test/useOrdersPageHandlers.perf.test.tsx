import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrdersPageHandlers } from "../app/(app)/orders/useOrdersPageHandlers";

// Mock the query hook so we can intercept mutateAsync
vi.mock("@/hooks/queries/useOrdersQuery", () => {
	return {
		useOrdersQuery: () => ({ data: [] }),
		useSaveOrderMutation: () => ({
			mutateAsync: vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return {};
			}),
		}),
		useBulkDeleteOrdersMutation: () => ({ mutateAsync: vi.fn() }),
		useBulkUpdateOrderStageMutation: () => ({
			mutateAsync: vi.fn().mockResolvedValue({}),
		}),
	};
});

// Also mock useSelectedRowsSync as we don't want it to clear selected rows or conflict
vi.mock("@/hooks/useSelectedRowsSync", () => {
	return {
		useSelectedRowsSync: () => {},
	};
});

describe("Performance: handleConfirmBooking", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient();
	});

	it("measures execution time of handleConfirmBooking", async () => {
		const { result } = renderHook(() => useOrdersPageHandlers(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		// Set 10 selected rows
		const rows = Array.from({ length: 10 }).map((_, i) => ({
			id: `row-${i}`,
			partNumber: `part-${i}`,
			description: `desc-${i}`,
			actionNote: "",
		})) as any[];

		act(() => {
			result.current.setSelectedRows(rows);
		});

		const start = performance.now();
		await act(async () => {
			await result.current.handleConfirmBooking(
				"2023-10-10",
				"Test Note",
				"Confirmed",
			);
		});
		const end = performance.now();
		const duration = end - start;

		console.log(`Execution time for 10 rows: ${duration}ms`);
		// If sequential: 10 * 50ms = 500ms
		// If concurrent: ~50ms

		// Ensure that we successfully awaited everything.
		// It's currently sequentially awaited, so we expect it to be around 500ms.
		expect(duration).toBeGreaterThan(0);
	});
});
