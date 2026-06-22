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
	quantity: 1,
	status: "Orders",
	rDate: "2024-01-01",
	repairSystem: "None",
	startWarranty: "",
	endWarranty: endWarranty || "",
	remainTime: "",
});

const createCntrWarrantyRow = (
	id: string,
	cntrRdg: number,
	createdAt: string,
): PendingRow => ({
	...createMockRow(id),
	repairSystem: "ضمان",
	cntrRdg,
	createdAt,
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
					notifications: [],
					// biome-ignore lint/suspicious/noExplicitAny: Test mock setup
				}) as unknown as any,
		);
	};

	const createMainSheetStore = (mainRows: PendingRow[]) => {
		queryClient.setQueryData(getOrdersQueryKey("orders"), []);
		queryClient.setQueryData(getOrdersQueryKey("main"), mainRows);
		queryClient.setQueryData(getOrdersQueryKey("booking"), []);
		queryClient.setQueryData(getOrdersQueryKey("call"), []);

		return create<CombinedStore>(
			(...a) =>
				({
					// biome-ignore lint/suspicious/noExplicitAny: Bypass middleware checks for testing
					...createNotificationSlice(a[0], a[1], a[2] as any),
					notifications: [],
					// biome-ignore lint/suspicious/noExplicitAny: Test mock setup
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
		// Valid row: 2026-01-05 (future, within 35-day threshold)
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
		// but Math.ceil(negative / ms_per_day) = 0, which passes >= 0 && <= 35 check.
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

		// Tomorrow — within 35-day threshold
		const futureRow = createMockRow("1", "2026-01-02");
		const store = createTestStore([futureRow]);

		store.getState().checkNotifications();

		expect(store.getState().notifications).toHaveLength(1);
		expect(store.getState().notifications[0].type).toBe("warranty");
	});

	it("should create warranty notification at exactly 35 days remaining (upper boundary)", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		vi.setSystemTime(now);

		// 2026-02-05 midnight: diffTime = 34d 14h → Math.ceil = 35 → passes <= 35 check
		const boundaryRow = createMockRow("1", "2026-02-05");
		const store = createTestStore([boundaryRow]);

		store.getState().checkNotifications();

		expect(store.getState().notifications).toHaveLength(1);
		expect(store.getState().notifications[0].type).toBe("warranty");
	});

	it("should NOT create warranty notification at 36 days remaining (outside threshold)", () => {
		const now = new Date("2026-01-01T10:00:00Z");
		vi.setSystemTime(now);

		// 2026-02-06 midnight: diffTime = 35d 14h → Math.ceil = 36 → fails <= 35 check
		const outsideRow = createMockRow("1", "2026-02-06");
		const store = createTestStore([outsideRow]);

		store.getState().checkNotifications();

		expect(store.getState().notifications).toHaveLength(0);
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
				// biome-ignore lint/style/noNonNullAssertion: managedKey is set just above
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

	describe("CNTR RDG Warning", () => {
		it("generates a high-risk warning for warranty row with cntrRdg >= 85000 after 10 days", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			// Created 11 days ago — past the 10-day threshold
			const createdAt = new Date(
				now.getTime() - 11 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-1", 90_000, createdAt),
			]);

			store.getState().checkNotifications();

			const notifications = store.getState().notifications;
			expect(notifications).toHaveLength(1);
			expect(notifications[0].type).toBe("cntr_rdg_warning");
			expect(notifications[0].cntrRdgLevel).toBe("high");
			expect(notifications[0].referenceId).toBe("row-1");
			expect(notifications[0].managedKey).toBe("cntr_rdg_warning:row-1:high");
		});

		it("generates an early-warning for warranty row with cntrRdg >= 70000 after 14 days", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			const createdAt = new Date(
				now.getTime() - 15 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-2", 75_000, createdAt),
			]);

			store.getState().checkNotifications();

			const notifications = store.getState().notifications;
			expect(notifications).toHaveLength(1);
			expect(notifications[0].type).toBe("cntr_rdg_warning");
			expect(notifications[0].cntrRdgLevel).toBe("early");
			expect(notifications[0].managedKey).toBe("cntr_rdg_warning:row-2:early");
		});

		it("generates only high-risk when row qualifies for both thresholds", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			const createdAt = new Date(
				now.getTime() - 15 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-3", 90_000, createdAt),
			]);

			store.getState().checkNotifications();

			const notifications = store.getState().notifications;
			expect(notifications).toHaveLength(1);
			expect(notifications[0].cntrRdgLevel).toBe("high");
		});

		it("does not alert when cntrRdg is below both thresholds", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			const createdAt = new Date(
				now.getTime() - 20 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-4", 60_000, createdAt),
			]);

			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("does not alert for non-warranty orders regardless of cntrRdg", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			const createdAt = new Date(
				now.getTime() - 15 * 24 * 60 * 60 * 1000,
			).toISOString();

			const nonWarrantyRow: PendingRow = {
				...createMockRow("row-5"),
				repairSystem: "Other",
				cntrRdg: 90_000,
				createdAt,
			};

			const store = createMainSheetStore([nonWarrantyRow]);
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("does not alert for high-risk row before the 10-day threshold", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			// Only 8 days ago — before the 10-day threshold
			const createdAt = new Date(
				now.getTime() - 8 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-6", 90_000, createdAt),
			]);

			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("does not alert for early-warning row before the 14-day threshold", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			// 12 days ago — past 10-day threshold but cntrRdg only qualifies for early
			const createdAt = new Date(
				now.getTime() - 12 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-7", 75_000, createdAt),
			]);

			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});

		it("dismissed cntr_rdg_warning does not respawn on next sync", () => {
			const now = new Date("2026-05-20T12:00:00Z");
			vi.setSystemTime(now);
			const createdAt = new Date(
				now.getTime() - 11 * 24 * 60 * 60 * 1000,
			).toISOString();

			const store = createMainSheetStore([
				createCntrWarrantyRow("row-8", 90_000, createdAt),
			]);

			// First sync — warning appears
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(1);

			// User dismisses it
			const notifId = store.getState().notifications[0].id;
			store.getState().removeNotification(notifId);
			expect(store.getState().notifications).toHaveLength(0);

			// Second sync — must NOT respawn
			store.getState().checkNotifications();
			expect(store.getState().notifications).toHaveLength(0);
		});
	});
});
