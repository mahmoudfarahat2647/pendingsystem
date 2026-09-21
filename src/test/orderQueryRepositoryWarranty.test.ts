import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderQueryRepository } from "@/services/order/orderQueryRepository";

// Issue #250: the warranty-archival sweep must filter repairSystem at the
// database level instead of fetching full stage datasets. These tests lock
// the query shape of fetchMappedOrdersByRepairSystem: stage equality plus a
// PostgREST JSON-arrow equality on metadata->>repairSystem (same precedent
// as the metadata->>partNumber prefilters), with the existing paging,
// ordering, and missing-attachment-column fallback contracts preserved.

function makeRawRow(id: string, stage: string) {
	return {
		id,
		stage,
		order_number: `ORD-${id}`,
		customer_name: "Customer",
		customer_phone: "123",
		vin: "VIN0001",
		company: null,
		attachment_link: "",
		attachment_file_path: "",
		attachment_file_paths: [],
		status: "Pending",
		metadata: { repairSystem: "ضمان", endWarranty: "2000-01-01" },
		created_at: "2026-01-01T00:00:00.000Z",
		updated_at: "2026-01-01T00:00:00.000Z",
		order_reminders: [],
	};
}

function makeDb(rangeImpl: (...args: unknown[]) => unknown) {
	const filter = vi.fn().mockReturnThis();
	const eq = vi.fn().mockReturnThis();
	const order = vi.fn().mockReturnThis();
	const range = vi.fn(rangeImpl);
	const select = vi.fn().mockReturnThis();
	const chainable = {
		select,
		eq,
		ilike: vi.fn().mockReturnThis(),
		filter,
		order,
		range,
	};
	const from = vi.fn().mockReturnValue(chainable);
	return {
		db: { from } as unknown as Parameters<typeof createOrderQueryRepository>[0],
		chainable,
		select,
		eq,
		filter,
		order,
		range,
	};
}

describe("orderQueryRepository fetchMappedOrdersByRepairSystem (#250)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("filters by stage and repairSystem at the database level", async () => {
		const { db, eq, filter, order } = makeDb(() =>
			Promise.resolve({ data: [makeRawRow("row-1", "orders")], error: null }),
		);
		const repo = createOrderQueryRepository(db);

		const rows = await repo.fetchMappedOrdersByRepairSystem("orders", "ضمان");

		expect(eq).toHaveBeenCalledWith("stage", "orders");
		expect(filter).toHaveBeenCalledWith(
			"metadata->>repairSystem",
			"eq",
			"ضمان",
		);
		expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
		expect(order).toHaveBeenCalledWith("id", { ascending: true });
		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("row-1");
		expect(rows[0].repairSystem).toBe("ضمان");
	});

	it("transfers only database-filtered expiry candidates", async () => {
		const expired = makeRawRow("expired", "orders");
		const future = {
			...makeRawRow("future", "orders"),
			metadata: { repairSystem: "ضمان", endWarranty: "2099-01-01" },
		};
		const requests: URL[] = [];
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = new URL(
				input instanceof Request ? input.url : input.toString(),
			);
			requests.push(url);
			const orFilter = url.searchParams.get("or") ?? "";
			const startWarrantyFilters = url.searchParams.getAll(
				"metadata->>startWarranty",
			);
			const rows = orFilter.includes("endWarranty.lt.2026-09-21")
				? [expired]
				: startWarrantyFilters.includes("lte.2023-09-21")
					? []
					: [expired, future];

			return new Response(JSON.stringify(rows), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Content-Range": rows.length > 0 ? `0-${rows.length - 1}/*` : "*/0",
				},
			});
		});
		const db = createClient("https://example.supabase.co", "test-key", {
			auth: { persistSession: false },
			global: { fetch: fetchMock },
		});
		const repo = createOrderQueryRepository(db);
		const fetchCandidates = repo.fetchMappedOrdersByRepairSystem as unknown as (
			stage: "orders",
			repairSystem: string,
			asOf: Date,
		) => Promise<Array<{ id: string }>>;

		const rows = await fetchCandidates("orders", "ضمان", new Date(2026, 8, 21));

		expect(requests).toHaveLength(2);
		const serializedFilters = requests.flatMap((url) => [
			url.searchParams.get("or") ?? "",
			...url.searchParams.getAll("metadata->>startWarranty"),
		]);
		expect(serializedFilters).toEqual(
			expect.arrayContaining([
				expect.stringContaining("endWarranty.lt.2026-09-21"),
				expect.stringContaining("lte.2023-09-21"),
			]),
		);
		expect(rows.map((row) => row.id)).toEqual(["expired"]);
	});

	it("pages through the full filtered result set", async () => {
		const fullPage = Array.from({ length: 1000 }, (_, i) =>
			makeRawRow(`row-${i}`, "main"),
		);
		const { db, range, filter } = makeDb(() =>
			Promise.resolve({ data: [], error: null }),
		);
		// First page is full (1000 rows) so paging continues; second is
		// empty so it stops.
		let calls = 0;
		range.mockImplementation(() => {
			const page = calls === 0 ? fullPage : [];
			calls += 1;
			return Promise.resolve({ data: page, error: null });
		});
		const repo = createOrderQueryRepository(db);

		const rows = await repo.fetchMappedOrdersByRepairSystem("main", "ضمان");

		expect(rows).toHaveLength(1000);
		expect(range).toHaveBeenCalledTimes(2);
		expect(range).toHaveBeenCalledWith(0, 999);
		expect(range).toHaveBeenCalledWith(1000, 1999);
		// Every page carries the server-side repairSystem filter.
		expect(filter).toHaveBeenCalledWith(
			"metadata->>repairSystem",
			"eq",
			"ضمان",
		);
	});

	it("falls back to the base select when attachment columns are missing", async () => {
		const missingColumnError = {
			message: "schema cache could not find attachment_link column",
			code: "PGRST200",
			details: "",
			hint: "",
		};
		const { db, chainable, select, filter } = makeDb(() =>
			Promise.resolve({ data: [makeRawRow("row-9", "call")], error: null }),
		);
		// First paged pass (with attachments) fails with the schema-cache
		// error; the fallback pass succeeds.
		const { range } = chainable;
		range.mockImplementationOnce(() =>
			Promise.resolve({ data: null, error: missingColumnError }),
		);
		range.mockImplementation(() =>
			Promise.resolve({ data: [makeRawRow("row-9", "call")], error: null }),
		);
		const repo = createOrderQueryRepository(db);

		const rows = await repo.fetchMappedOrdersByRepairSystem("call", "ضمان");

		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("row-9");
		expect(select).toHaveBeenCalledWith(
			expect.stringContaining("attachment_link"),
		);
		expect(select).toHaveBeenCalledWith(
			expect.not.stringContaining("attachment_link"),
		);
		// The fallback pass keeps the repairSystem filter applied.
		expect(filter).toHaveBeenCalledWith(
			"metadata->>repairSystem",
			"eq",
			"ضمان",
		);
	});
});
