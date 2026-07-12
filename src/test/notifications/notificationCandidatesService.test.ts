import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDueNotificationCandidates } from "@/services/notifications/notificationCandidatesService";

const mockFetch = vi.fn();

function makeOrderRow(id: string, overrides: Record<string, unknown> = {}) {
	return {
		id,
		stage: "orders",
		order_number: `T${id}`,
		customer_name: "Test User",
		customer_email: null,
		customer_phone: "123",
		vin: `VIN${id}`,
		company: null,
		status: "pending",
		metadata: {
			baseId: `B${id}`,
			cntrRdg: 0,
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
		},
		created_at: "2026-01-01T00:00:00.000Z",
		updated_at: "2026-01-01T00:00:00.000Z",
		order_reminders: [],
		...overrides,
	};
}

describe("fetchDueNotificationCandidates", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("maps candidate rows through mapSupabaseOrder", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ candidates: [makeOrderRow("1")] }),
		});

		const rows = await fetchDueNotificationCandidates();

		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("1");
		expect(rows[0].vin).toBe("VIN1");
	});

	it("throws (rather than silently skipping) when a row fails mapping", async () => {
		// order_number missing / malformed metadata causing a schema validation
		// failure inside mapSupabaseOrder. This must propagate so React Query
		// keeps the previous good candidate set instead of the notification
		// engine seeing a partial one and wrongly pruning dismissed keys.
		const badRow = makeOrderRow("bad", { metadata: null, id: undefined });

		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ candidates: [badRow] }),
		});

		await expect(fetchDueNotificationCandidates()).rejects.toThrow();
	});

	it("throws when the response is not ok", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 401,
			json: async () => ({ error: "Unauthorized" }),
		});

		await expect(fetchDueNotificationCandidates()).rejects.toThrow(
			"Unauthorized",
		);
	});
});
