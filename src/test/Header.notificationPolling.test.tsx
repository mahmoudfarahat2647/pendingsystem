import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/shared/Header";
import { shouldRunNotificationCheck } from "@/components/shared/headerNotificationPolling";
import { getOrdersQueryKey, queryClient } from "@/lib/queryClient";
import type { OrderStage } from "@/services/orderService";

const navigationMocks = vi.hoisted(() => ({
	pathname: "/orders",
	push: vi.fn(),
	replace: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
	state: {
		checkNotifications: vi.fn(),
		searchTerm: "",
		setSearchTerm: vi.fn(),
	},
}));

const draftSessionMocks = vi.hoisted(() => ({
	value: {
		canUndo: false,
		canRedo: false,
		undoDraft: vi.fn(),
		redoDraft: vi.fn(),
		dirty: false,
		saving: false,
		pendingCommandCount: 0,
		saveDraft: vi.fn(),
	},
}));

vi.mock("next/navigation", () => ({
	usePathname: () => navigationMocks.pathname,
	useRouter: () => ({
		push: navigationMocks.push,
		replace: navigationMocks.replace,
	}),
}));

vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (state: typeof storeMocks.state) => unknown) =>
		selector(storeMocks.state),
}));

vi.mock("@/hooks/useDraftSession", () => ({
	useDraftSession: () => draftSessionMocks.value,
}));

vi.mock("@/components/shared/NotificationsDropdown", () => ({
	NotificationsDropdown: () => <div data-testid="notifications-dropdown" />,
}));

describe("Header notification polling", () => {
	const activeStages: OrderStage[] = ["orders", "main", "call", "booking"];

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));
		queryClient.clear();
		storeMocks.state.checkNotifications.mockReset();
		storeMocks.state.setSearchTerm.mockReset();
	});

	afterEach(() => {
		queryClient.clear();
		vi.useRealTimers();
	});

	function seedQueryState(updatedAtOffsetMs = 0) {
		for (const stage of activeStages) {
			queryClient.setQueryData(getOrdersQueryKey(stage), [], {
				updatedAt: Date.now() + updatedAtOffsetMs,
			});
		}
	}

	it("polls again within the same minute once the freshness window has elapsed", async () => {
		seedQueryState();
		render(<Header />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(storeMocks.state.checkNotifications).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(7000);
		});
		expect(storeMocks.state.checkNotifications).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(10000);
		});
		expect(storeMocks.state.checkNotifications).toHaveBeenCalledTimes(2);
	});

	it("skips unchanged data when the last scan was less than eight seconds ago", async () => {
		seedQueryState();
		render(<Header />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(7000);
		});

		expect(storeMocks.state.checkNotifications).toHaveBeenCalledTimes(1);
	});

	it("rechecks immediately when cached query data changes", () => {
		expect(
			shouldRunNotificationCheck(200, 7_000, {
				dataVersion: 100,
				lastRunAt: 3_000,
			}),
		).toBe(true);
	});
});
