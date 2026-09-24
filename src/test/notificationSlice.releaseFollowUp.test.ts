import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { translate } from "@/lib/i18n/translate";
import {
	getOrdersQueryKey,
	NOTIFICATION_CANDIDATES_QUERY_KEY,
	RELEASE_FOLLOW_UPS_QUERY_KEY,
} from "@/lib/queryClient";
import type { ReleaseFollowUp } from "@/schemas/releaseFollowUp.schema";
import { createNotificationSlice } from "@/store/slices/notificationSlice";
import type { CombinedStore } from "@/store/types";
import type { PendingRow } from "@/types";
import { queryClient } from "./testQueryClient";

const createMockRow = (id: string, vin: string): PendingRow =>
	({
		id,
		baseId: `B${id}`,
		trackingId: `T${id}`,
		customerName: "Test User",
		vin,
		mobile: "123",
		cntrRdg: 4999,
		model: "Test",
		parts: [],
		sabNumber: "S1",
		acceptedBy: "User",
		requester: "User",
		partNumber: "P1",
		description: "Desc",
		quantity: 1,
		status: "Pending",
		rDate: "2024-01-01",
		repairSystem: "ضمان",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		stage: "main",
	}) as PendingRow;

describe("notificationSlice: release_followup", () => {
	const createTestStore = (
		followUps: ReleaseFollowUp[],
		rows: PendingRow[] = [],
	) => {
		queryClient.setQueryData(NOTIFICATION_CANDIDATES_QUERY_KEY, []);
		queryClient.setQueryData(RELEASE_FOLLOW_UPS_QUERY_KEY, followUps);
		queryClient.setQueryData(getOrdersQueryKey("main"), rows);
		for (const stage of [
			"orders",
			"call",
			"booking",
			"archive",
			"freeze",
		] as const) {
			queryClient.setQueryData(getOrdersQueryKey(stage), []);
		}

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

	it("creates one notification per VIN whose follow-up is due", () => {
		vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
		const store = createTestStore([
			{
				vin: "VF1RFA00000000001",
				nextDueAt: "2026-02-01T00:00:00Z",
				referenceRowId: "row-1",
				createdAt: "2026-01-01T00:00:00Z",
				updatedAt: "2026-01-01T00:00:00Z",
			},
		]);

		store.getState().checkNotifications();

		const notifications = store.getState().notifications;
		expect(notifications).toHaveLength(1);
		expect(notifications[0].type).toBe("release_followup");
		expect(notifications[0].vin).toBe("VF1RFA00000000001");
		expect(notifications[0].managedKey).toBe(
			"release_followup:VF1RFA00000000001:2026-02-01T00:00:00Z",
		);
	});

	it("emits localization keys that render to the English strings", () => {
		vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
		const store = createTestStore([
			{
				vin: "VF1RFA00000000001",
				nextDueAt: "2026-02-01T00:00:00Z",
				referenceRowId: "row-1",
				createdAt: "2026-01-01T00:00:00Z",
				updatedAt: "2026-01-01T00:00:00Z",
			},
		]);

		store.getState().checkNotifications();

		const [n] = store.getState().notifications;
		expect(n.titleKey).toBe("notifications.releaseFollowUpTitle");
		expect(n.descriptionKey).toBe("notifications.releaseFollowUpDescription");
		expect(n.params).toEqual({ vin: "VF1RFA00000000001" });
		expect(translate("en", n.titleKey as string, n.params)).toBe(n.title);
		expect(translate("en", n.descriptionKey as string, n.params)).toBe(
			n.description,
		);
	});

	it("does not create a notification before the due date", () => {
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
		const store = createTestStore([
			{
				vin: "VF1RFA00000000001",
				nextDueAt: "2026-03-01T00:00:00Z",
				referenceRowId: null,
				createdAt: "2026-01-01T00:00:00Z",
				updatedAt: "2026-01-01T00:00:00Z",
			},
		]);

		store.getState().checkNotifications();

		expect(store.getState().notifications).toHaveLength(0);
	});

	it("does not respawn a dismissed (snoozed) key at the same due date", () => {
		vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
		const followUp: ReleaseFollowUp = {
			vin: "VF1RFA00000000001",
			nextDueAt: "2026-02-01T00:00:00Z",
			referenceRowId: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};
		const store = createTestStore([followUp]);

		store.getState().checkNotifications();
		expect(store.getState().notifications).toHaveLength(1);

		store.getState().removeNotification(store.getState().notifications[0].id);
		expect(store.getState().notifications).toHaveLength(0);

		// Re-run without the due date changing — should stay dismissed.
		store.getState().checkNotifications();
		expect(store.getState().notifications).toHaveLength(0);
	});

	it("leaves other notification types (e.g. reminder) untouched", () => {
		vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
		const row = createMockRow("row-1", "VF1RFA00000000001");
		const store = createTestStore([]);
		queryClient.setQueryData(NOTIFICATION_CANDIDATES_QUERY_KEY, [
			{
				...row,
				reminder: { date: "2026-01-01", time: "00:00", subject: "Call back" },
			},
		]);

		store.getState().checkNotifications();

		const types = store.getState().notifications.map((n) => n.type);
		expect(types).toContain("reminder");
		expect(types).not.toContain("release_followup");
	});
});
