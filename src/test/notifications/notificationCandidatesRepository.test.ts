import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNotificationCandidatesRepository } from "@/services/notifications/notificationCandidatesRepository";

type Response = { data: unknown[] | null; error: null };

/**
 * A minimal thenable query-builder stub mirroring the real Supabase
 * PostgrestFilterBuilder: every chain method returns `this` so calls can be
 * chained in any order, and the object itself resolves via `.then` (so
 * `await builder` works regardless of how many chain calls preceded it).
 */
function makeBuilder(response: Response) {
	const calls: { method: string; args: unknown[] }[] = [];
	// biome-ignore lint/suspicious/noExplicitAny: generic fluent test builder
	const builder: any = { __calls: calls };
	const methods = [
		"select",
		"neq",
		"eq",
		"not",
		"lte",
		"gte",
		"filter",
		"in",
		"order",
	];
	for (const method of methods) {
		builder[method] = vi.fn((...args: unknown[]) => {
			calls.push({ method, args });
			return builder;
		});
	}
	// biome-ignore lint/suspicious/noThenProperty: intentional thenable stub mirroring Supabase's PostgrestFilterBuilder
	builder.then = (
		resolve: (value: Response) => void,
		reject?: (reason: unknown) => void,
	) => Promise.resolve(response).then(resolve, reject);
	return builder;
}

/**
 * Fake db client that hands out builders in `.from()` call order. Because the
 * repository runs the reminder phase and the three single-stage queries under
 * `Promise.all`, that order is: reminderIds, warranty, booking, cntr, and
 * finally the reminders full-select (which only fires, after its own await, if
 * the reminderIds query returned any ids).
 */
function makeFakeDb(responses: Response[]) {
	let call = 0;
	const builders = responses.map(makeBuilder);
	const from = vi.fn(() => {
		const b = builders[call];
		call += 1;
		return b;
	});
	return { from, builders };
}

function orderRow(
	id: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id,
		stage: "orders",
		order_number: `T${id}`,
		customer_name: "Test User",
		vin: `VIN${id}`,
		metadata: {},
		created_at: "2026-01-01T00:00:00.000Z",
		order_reminders: [],
		...overrides,
	};
}

describe("notificationCandidatesRepository", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-20T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns an empty set with no candidates and no reminder ids found", async () => {
		const { from } = makeFakeDb([
			{ data: [], error: null }, // reminderIds
			{ data: [], error: null }, // warranty
			{ data: [], error: null }, // booking
			{ data: [], error: null }, // cntr
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		const result = await repo.getDueNotificationCandidates();

		expect(result).toEqual([]);
	});

	it("dedupes a row that qualifies for multiple categories (reminder + warranty)", async () => {
		const sharedRow = orderRow("shared-1", {
			metadata: { endWarranty: "2026-06-01" },
		});
		// Under Promise.all the `.from()` calls resolve in the order:
		// reminderIds, warranty, booking, cntr, reminders-full (the reminder
		// full-select fires after its own await resolves).
		const { from, builders } = makeFakeDb([
			{ data: [{ id: "shared-1" }], error: null }, // reminderIds
			{ data: [sharedRow], error: null }, // warranty (same row)
			{ data: [], error: null }, // booking
			{ data: [], error: null }, // cntr
			{ data: [sharedRow], error: null }, // reminders full-select
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		const result = await repo.getDueNotificationCandidates();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("shared-1");
		void builders;
	});

	it("returns the full unfiltered order_reminders embed for reminder candidates, not just the matching one", async () => {
		// Two uncompleted reminders on the same order — the candidacy filter
		// must not shape which ones come back for mapping (that decision
		// belongs entirely to mapSupabaseOrder on the client, which picks
		// "first uncompleted" — the server must return both).
		const rowWithTwoReminders = orderRow("multi-reminder", {
			order_reminders: [
				{
					id: "r1",
					title: "First",
					remind_at: "2026-05-19T00:00:00.000Z",
					is_completed: false,
				},
				{
					id: "r2",
					title: "Second",
					remind_at: "2026-05-20T00:00:00.000Z",
					is_completed: false,
				},
			],
		});
		const { from } = makeFakeDb([
			{ data: [{ id: "multi-reminder" }], error: null }, // reminderIds
			{ data: [], error: null }, // warranty
			{ data: [], error: null }, // booking
			{ data: [], error: null }, // cntr
			{ data: [rowWithTwoReminders], error: null }, // reminders full-select
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		const result = await repo.getDueNotificationCandidates();

		expect(result).toHaveLength(1);
		const reminders = result[0].order_reminders as unknown[];
		expect(reminders).toHaveLength(2);
	});

	it("skips the reminders full-select query entirely when no reminder ids are found", async () => {
		const { from } = makeFakeDb([
			{ data: [], error: null }, // reminderIds — empty
			{ data: [], error: null }, // warranty
			{ data: [], error: null }, // booking
			{ data: [], error: null }, // cntr
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		await repo.getDueNotificationCandidates();

		// Exactly 4 `.from()` calls, not 5 — the second reminders query never runs.
		expect(from).toHaveBeenCalledTimes(4);
	});

	it("includes a high-risk CNTR-RDG row aged 11 days (regression: the server bound must derive from the 10-day threshold, not the 14-day one)", async () => {
		const highRiskRow = orderRow("cntr-high", {
			stage: "main",
			metadata: { repairSystem: "ضمان", cntrRdg: 90_000 },
			created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
		});
		const { from, builders } = makeFakeDb([
			{ data: [], error: null }, // reminderIds
			{ data: [], error: null }, // warranty
			{ data: [], error: null }, // booking
			{ data: [highRiskRow], error: null }, // cntr
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		const result = await repo.getDueNotificationCandidates();

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("cntr-high");

		// The cutoff passed to the CNTR query's created_at filter must be no
		// tighter than "9 days ago" — if it were "14 days ago" (the early-warning
		// threshold), an 11-day-old high-risk row would have been excluded by
		// Postgres before ever reaching the client's exact re-check.
		const cntrBuilder = builders[3];
		const lteCall = cntrBuilder.__calls.find(
			(c: { method: string }) => c.method === "lte",
		);
		expect(lteCall).toBeDefined();
		const cutoffArg = new Date(lteCall.args[1] as string);
		const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
		expect(cutoffArg.getTime()).toBeLessThanOrEqual(
			nineDaysAgo.getTime() + 1000,
		);
		expect(cutoffArg.getTime()).toBeGreaterThan(
			new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).getTime(),
		);
	});

	it("orders every query deterministically by created_at then id", async () => {
		const { from, builders } = makeFakeDb([
			{ data: [], error: null },
			{ data: [], error: null },
			{ data: [], error: null },
			{ data: [], error: null },
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		await repo.getDueNotificationCandidates();

		for (const builder of builders) {
			const orderCalls = builder.__calls.filter(
				(c: { method: string }) => c.method === "order",
			);
			expect(orderCalls.length).toBeGreaterThanOrEqual(2);
			expect(orderCalls[0].args).toEqual(["created_at", { ascending: true }]);
			expect(orderCalls[1].args).toEqual(["id", { ascending: true }]);
		}
	});

	it("filters reminder candidacy without completed reminders due far in the future", async () => {
		const { from, builders } = makeFakeDb([
			{ data: [], error: null },
			{ data: [], error: null },
			{ data: [], error: null },
			{ data: [], error: null },
		]);

		// biome-ignore lint/suspicious/noExplicitAny: fake db satisfies the subset used
		const repo = createNotificationCandidatesRepository({ from } as any);
		await repo.getDueNotificationCandidates();

		const reminderIdsBuilder = builders[0];
		const notCall = reminderIdsBuilder.__calls.find(
			(c: { method: string }) => c.method === "not",
		);
		expect(notCall.args).toEqual(["order_reminders.is_completed", "eq", true]);
		const neqCall = reminderIdsBuilder.__calls.find(
			(c: { method: string }) => c.method === "neq",
		);
		expect(neqCall.args).toEqual(["stage", "archive"]);
	});
});
