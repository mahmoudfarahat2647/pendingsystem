import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QueryProvider from "@/components/providers/QueryProvider";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { getOrdersQueryAdapter } from "@/store/ordersQueryAdapter";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

// `QueryProvider` reaches for `next/dynamic` (devtools) which is a no-op here
// because NODE_ENV !== "development" in the test runner.

/**
 * Renders `<QueryProvider>` and hands back the isolated `QueryClient` that the
 * provider created for this mount (captured via the React Query context, i.e.
 * the exact instance bound to `<QueryClientProvider>`).
 */
function renderProviderAndCaptureClient() {
	let captured: QueryClient | undefined;

	function Probe() {
		captured = useQueryClient();
		return null;
	}

	const utils = render(
		<QueryProvider>
			<Probe />
		</QueryProvider>,
	);

	if (!captured) {
		throw new Error("QueryProvider did not expose a QueryClient");
	}
	return { client: captured, ...utils };
}

const makeReminderRow = (id: string): PendingRow => ({
	id,
	baseId: `B${id}`,
	trackingId: `T${id}`,
	customerName: "Test User",
	vin: `VIN${id}`,
	mobile: "123",
	cntrRdg: 1000,
	model: "Test",
	parts: [],
	sabNumber: "S1",
	acceptedBy: "User",
	requester: "User",
	partNumber: "P1",
	description: "Desc",
	quantity: 1,
	status: "Orders",
	rDate: "2024-01-01",
	repairSystem: "None",
	startWarranty: "",
	endWarranty: "",
	remainTime: "",
	reminder: { date: "2026-03-01", time: "10:00", subject: "Call customer" },
});

describe("QueryProvider", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Reset the persisted store's notification state between tests.
		useAppStore.setState({
			notifications: [],
			dismissedManagedNotificationKeys: {},
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("creates a fresh, isolated QueryClient per mount (no shared singleton)", () => {
		// AC #1 / #5: two independent provider trees — standing in for two
		// separate browser sessions — must never share a query cache.
		const first = renderProviderAndCaptureClient();
		const second = renderProviderAndCaptureClient();

		expect(first.client).toBeDefined();
		expect(second.client).toBeDefined();
		expect(first.client).not.toBe(second.client);

		// Data written into one client is invisible to the other.
		first.client.setQueryData(getOrdersQueryKey("orders"), [
			makeReminderRow("1"),
		]);
		expect(
			second.client.getQueryData(getOrdersQueryKey("orders")),
		).toBeUndefined();
	});

	it("registers the adapter against the provider's live client so checkNotifications reads it", () => {
		// AC #2 / #3: mounting the provider wires `setOrdersQueryAdapter` to the
		// client it created; the store then reads live data through that adapter.
		vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

		const { client } = renderProviderAndCaptureClient();

		// Seed the live client the provider is bound to (not a stale singleton).
		client.setQueryData(getOrdersQueryKey("orders"), [makeReminderRow("1")]);
		client.setQueryData(getOrdersQueryKey("main"), []);
		client.setQueryData(getOrdersQueryKey("booking"), []);
		client.setQueryData(getOrdersQueryKey("call"), []);

		act(() => {
			useAppStore.getState().checkNotifications();
		});

		const reminders = useAppStore
			.getState()
			.notifications.filter((n) => n.type === "reminder");
		expect(reminders).toHaveLength(1);
		expect(reminders[0]?.referenceId).toBe("1");
	});

	it("tears down the adapter on unmount so registration stays symmetric", () => {
		// Regression guard: the adapter registration must be paired with a cleanup
		// so React StrictMode's dev-only setup->cleanup->setup replay cannot leave
		// the registration counter imbalanced (which would trip a false
		// "registered more than once" warning). After unmount the live adapter is
		// gone and reads fall back to the no-op default.
		const { client, unmount } = renderProviderAndCaptureClient();
		client.setQueryData(getOrdersQueryKey("orders"), [makeReminderRow("1")]);
		expect(getOrdersQueryAdapter().getStageRows("orders")).toHaveLength(1);

		unmount();

		expect(getOrdersQueryAdapter().getStageRows("orders")).toBeUndefined();
	});
});
