import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { getOrdersQueryKey, queryClient } from "@/lib/queryClient";
import { createNotificationSlice } from "../store/slices/notificationSlice";
import type { CombinedStore } from "../store/types";
import type { PendingRow } from "../types";

// Mock orderService
vi.mock("@/services/orderService", () => ({
	orderService: {
		updateOrdersStage: vi.fn(() => Promise.resolve([])),
	},
}));

// Mock row helper
const createMockRow = (id: string, endWarranty?: string): PendingRow => ({
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
	status: "Orders",
	rDate: "2024-01-01",
	repairSystem: "None",
	startWarranty: "",
	endWarranty: endWarranty || "",
	remainTime: "",
});

describe("notificationSlice", () => {
	const createTestStore = (rows: PendingRow[]) => {
		queryClient.setQueryData(getOrdersQueryKey("orders"), rows);
		queryClient.setQueryData(getOrdersQueryKey("main"), []);
		queryClient.setQueryData(getOrdersQueryKey("booking"), []);
		queryClient.setQueryData(getOrdersQueryKey("call"), []);

		return create<CombinedStore>(
			(...a) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Bypass middleware checks for testing
					...createNotificationSlice(a[0], a[1], a[2] as any),
					// Mock other slices/state required by checkNotifications
					rowData: [],
					ordersRowData: [],
					bookingRowData: [],
					callRowData: [],
					archiveRowData: [],
					notifications: [],
				}) as unknown as any,
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		queryClient.clear();
		vi.useRealTimers();
	});

	it("should not create warranty notification for fully expired warranties", () => {
		// Set "now" to 2026-01-01
		const now = new Date("2026-01-01T12:00:00Z");
		vi.setSystemTime(now);

		// Expired row: 2025-12-31 (yesterday) — daysRemaining < 0, fails >= 0 check
		const expiredRow = createMockRow("1", "2025-12-31");
		// Valid row: 2026-01-05 (future, within 10-day threshold)
		const validRow = createMockRow("2", "2026-01-05");

		const store = createTestStore([expiredRow, validRow]);

		store.getState().checkNotifications();

		// Only the valid row should generate a warranty notification
		const notifications = store.getState().notifications;
		expect(notifications).toHaveLength(1);
		expect(notifications[0].type).toBe("warranty");
		expect(notifications[0].referenceId).toBe("2");
	});

	it("should create warranty notification for warranty expiring today", () => {
		// Set "now" to 2026-01-01 T10:00
		const now = new Date("2026-01-01T10:00:00Z");
		vi.setSystemTime(now);

		// Expires today: "2026-01-01" parses to T00:00. diffTime is negative (-10h),
		// but Math.ceil(negative / ms_per_day) = 0, which passes >= 0 && <= 10 check.
		const expiringRow = createMockRow("1", "2026-01-01");
		const store = createTestStore([expiringRow]);

		store.getState().checkNotifications();

		const notifications = store.getState().notifications;
		expect(notifications).toHaveLength(1);
		expect(notifications[0].type).toBe("warranty");
		expect(notifications[0].description).toContain("0 days");
	});

	it("should create warranty notification for near-future warranty", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		vi.setSystemTime(now);

		// Tomorrow — within 10-day threshold
		const futureRow = createMockRow("1", "2026-01-02");
		const store = createTestStore([futureRow]);

		store.getState().checkNotifications();

		expect(store.getState().notifications).toHaveLength(1);
		expect(store.getState().notifications[0].type).toBe("warranty");
	});

	describe("Reminder Dismissal Logic", () => {
		it("should not respawn a dismissed notification on next sync", () => {
			const now = new Date("2026-03-01T12:00:00Z");
			vi.setSystemTime(now);

			const dueReminderRow = createMockRow("1");
			dueReminderRow.reminder = {
				date: "2026-03-01",
				time: "10:00",
				subject: "Call customer",
			};

			const store = createTestStore([dueReminderRow]);

			// 1. First sync - notification appears
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(1);
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(0);

			const notificationId = store.getState().notifications[0].id;
			const managedKey = store.getState().notifications[0].managedKey;

			// 2. User dismisses it via "X"
			store.getState().removeNotification(notificationId);
			expect(store.getState().notifications).toHaveLength(0);
			expect(
				store.getState().dismissedManagedNotificationKeys[managedKey!],
			).toBe(true);

			// 3. Second sync - should NOT respawn
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("should clear all and record their managed keys to prevent respawn", () => {
			const now = new Date("2026-03-01T12:00:00Z");
			vi.setSystemTime(now);

			const r1 = createMockRow("1");
			r1.reminder = { date: "2026-03-01", time: "10:00", subject: "A" };
			const r2 = createMockRow("2");
			r2.reminder = { date: "2026-03-01", time: "11:00", subject: "B" };

			const store = createTestStore([r1, r2]);

			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(2);

			// User clicks "Clear All"
			store.getState().clearNotifications();
			expect(store.getState().notifications).toHaveLength(0);
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(2);

			// Next sync should not resurrect them
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("should respawn if the subject changes (different managed key)", () => {
			const now = new Date("2026-03-01T12:00:00Z");
			vi.setSystemTime(now);

			const r1 = createMockRow("1");
			r1.reminder = { date: "2026-03-01", time: "10:00", subject: "Initial" };

			const store = createTestStore([r1]);

			// First sync & dismiss
			store.getState().checkNotifications();
			store.getState().removeNotification(store.getState().notifications[0].id);
			expect(store.getState().notifications).toHaveLength(0);

			// Admin edits the reminder subject
			r1.reminder.subject = "Updated";

			// Next sync should spawn a NEW notification
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(1);
			expect(store.getState().notifications[0].description).toContain(
				"Updated",
			);
		});

		it("should clean up dismissed keys strictly when items are no longer due", () => {
			const now = new Date("2026-03-01T12:00:00Z");
			vi.setSystemTime(now);

			const r1 = createMockRow("1");
			r1.reminder = { date: "2026-03-01", time: "10:00", subject: "A" };

			const store = createTestStore([r1]);

			// Sync and dismiss
			store.getState().checkNotifications();
			store.getState().removeNotification(store.getState().notifications[0].id);
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(1);

			// Simulating the user fulfilled the reminder by deleting it from the row
			r1.reminder = null;

			// Next sync
			store.getState().checkNotifications();
			// The dismissed keys should be pruned since "A" is no longer due globally
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(0);
		});

		it("should NOT prune dismissed keys if any cache is unloaded", () => {
			const now = new Date("2026-03-01T12:00:00Z");
			vi.setSystemTime(now);

			const r1 = createMockRow("1");
			r1.reminder = { date: "2026-03-01", time: "10:00", subject: "A" };

			const store = createTestStore([r1]);

			// 1. Sync and dismiss
			store.getState().checkNotifications();
			store.getState().removeNotification(store.getState().notifications[0].id);
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(1);

			// 2. Simulate the user fulfilling or changing the reminder
			r1.reminder = null;

			// 3. Simulate one cache being unloaded (e.g., user hasn't visited "main" yet)
			queryClient.removeQueries({ queryKey: getOrdersQueryKey("main") });

			// 4. Next sync - caches are partially loaded
			store.getState().checkNotifications();

			// The dismissed keys should be PRESERVED, not pruned, since allCachesLoaded = false
			expect(
				Object.keys(store.getState().dismissedManagedNotificationKeys),
			).toHaveLength(1);
		});
	});
});
