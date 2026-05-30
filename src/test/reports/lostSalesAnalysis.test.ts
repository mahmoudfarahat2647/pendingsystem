import { describe, expect, it } from "vitest";
import type { LostSalesFilters } from "@/domain/reports/lostSalesAnalysis";
import { computeLostSalesReport } from "@/domain/reports/lostSalesAnalysis";
import type { PendingRow } from "@/types";

const ALL_FILTERS: LostSalesFilters = { company: null, period: "all" };

function makeRow({
	id,
	...rest
}: Partial<PendingRow> & { id: string }): PendingRow {
	return {
		id,
		model: rest.model ?? "Camry",
		parts: rest.parts ?? [],
		partNumber: rest.partNumber ?? "",
		description: rest.description ?? "",
		quantity: rest.quantity ?? undefined,
		status: rest.status ?? "Pending",
		stage: rest.stage ?? "orders",
		company: rest.company ?? null,
		createdAt: rest.createdAt ?? undefined,
		...rest,
	} as PendingRow;
}

function daysAgoIso(days: number): string {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// 1. Empty rows
describe("computeLostSalesReport", () => {
	it("returns zero KPIs and empty arrays for empty input", () => {
		const result = computeLostSalesReport([], ALL_FILTERS);
		expect(result.kpis).toEqual({
			totalOrders: 0,
			distinctParts: 0,
			totalQuantity: 0,
			distinctModels: 0,
		});
		expect(result.topParts).toHaveLength(0);
		expect(result.modelDemand).toHaveLength(0);
	});

	// 2. Single row with 1 part
	it("handles a single row with one part correctly", () => {
		const row = makeRow({
			id: "r1",
			model: "Corolla",
			parts: [
				{
					id: "p1",
					partNumber: "PN-001",
					description: "Brake Pad",
					quantity: 2,
					rowId: "r1",
				},
			],
		});
		const result = computeLostSalesReport([row], ALL_FILTERS);
		expect(result.kpis.totalOrders).toBe(1);
		expect(result.kpis.distinctParts).toBe(1);
		expect(result.kpis.totalQuantity).toBe(2);
		expect(result.kpis.distinctModels).toBe(1);
		expect(result.topParts).toEqual([
			{
				partNumber: "PN-001",
				description: "Brake Pad",
				orderCount: 1,
				totalQuantity: 2,
				models: ["Corolla"],
			},
		]);
	});

	// 3. Row with 2 parts
	it("aggregates both parts from a multi-part row", () => {
		const row = makeRow({
			id: "r1",
			model: "Hilux",
			parts: [
				{
					id: "p1",
					partNumber: "PN-A",
					description: "Filter",
					quantity: 3,
					rowId: "r1",
				},
				{
					id: "p2",
					partNumber: "PN-B",
					description: "Belt",
					quantity: 1,
					rowId: "r1",
				},
			],
		});
		const result = computeLostSalesReport([row], ALL_FILTERS);
		expect(result.kpis.distinctParts).toBe(2);
		expect(result.kpis.totalQuantity).toBe(4);
		expect(result.topParts).toHaveLength(2);
		const pnA = result.topParts.find((p) => p.partNumber === "PN-A");
		expect(pnA).toMatchObject({ orderCount: 1, totalQuantity: 3 });
	});

	// 4. Two rows sharing the same partNumber
	it("sums quantity and counts 2 orders when two rows share a partNumber", () => {
		const rows = [
			makeRow({
				id: "r1",
				model: "Yaris",
				parts: [
					{
						id: "p1",
						partNumber: "SHARED",
						description: "Spark Plug",
						quantity: 4,
						rowId: "r1",
					},
				],
			}),
			makeRow({
				id: "r2",
				model: "Yaris",
				parts: [
					{
						id: "p2",
						partNumber: "SHARED",
						description: "Spark Plug",
						quantity: 2,
						rowId: "r2",
					},
				],
			}),
		];
		const result = computeLostSalesReport(rows, ALL_FILTERS);
		expect(result.kpis.totalOrders).toBe(2);
		expect(result.topParts).toHaveLength(1);
		expect(result.topParts[0]).toMatchObject({
			partNumber: "SHARED",
			orderCount: 2,
			totalQuantity: 6,
		});
	});

	// 5. Company filter
	it("null company includes all rows", () => {
		const rows = [
			makeRow({ id: "r1", company: "Acme", model: "A" }),
			makeRow({ id: "r2", company: "Beta", model: "B" }),
		];
		const result = computeLostSalesReport(rows, {
			company: null,
			period: "all",
		});
		expect(result.kpis.totalOrders).toBe(2);
	});

	it("specific company filter excludes non-matching rows", () => {
		const rows = [
			makeRow({
				id: "r1",
				company: "Acme",
				model: "A",
				parts: [
					{ id: "p1", partNumber: "PN-1", description: "X", quantity: 1 },
				],
			}),
			makeRow({
				id: "r2",
				company: "Beta",
				model: "B",
				parts: [
					{ id: "p2", partNumber: "PN-2", description: "Y", quantity: 1 },
				],
			}),
		];
		const result = computeLostSalesReport(rows, {
			company: "Acme",
			period: "all",
		});
		expect(result.kpis.totalOrders).toBe(1);
		expect(result.topParts.every((p) => p.partNumber === "PN-1")).toBe(true);
	});

	// 6. Period filter last30
	it("last30 includes row 29 days ago and excludes row 31 days ago", () => {
		const rows = [
			makeRow({
				id: "r1",
				model: "M1",
				createdAt: daysAgoIso(29),
				parts: [
					{ id: "p1", partNumber: "PN-X", description: "X", quantity: 1 },
				],
			}),
			makeRow({
				id: "r2",
				model: "M2",
				createdAt: daysAgoIso(31),
				parts: [
					{ id: "p2", partNumber: "PN-Y", description: "Y", quantity: 1 },
				],
			}),
		];
		const result = computeLostSalesReport(rows, {
			company: null,
			period: "last30",
		});
		expect(result.kpis.totalOrders).toBe(1);
		expect(result.topParts.map((p) => p.partNumber)).toContain("PN-X");
		expect(result.topParts.map((p) => p.partNumber)).not.toContain("PN-Y");
	});

	// 7. Period filter last90
	it("last90 includes row 89 days ago and excludes row 91 days ago", () => {
		const rows = [
			makeRow({
				id: "r1",
				model: "M1",
				createdAt: daysAgoIso(89),
				parts: [
					{ id: "p1", partNumber: "PN-IN", description: "In", quantity: 1 },
				],
			}),
			makeRow({
				id: "r2",
				model: "M2",
				createdAt: daysAgoIso(91),
				parts: [
					{ id: "p2", partNumber: "PN-OUT", description: "Out", quantity: 1 },
				],
			}),
		];
		const result = computeLostSalesReport(rows, {
			company: null,
			period: "last90",
		});
		expect(result.kpis.totalOrders).toBe(1);
		expect(result.topParts.map((p) => p.partNumber)).toContain("PN-IN");
		expect(result.topParts.map((p) => p.partNumber)).not.toContain("PN-OUT");
	});

	// 8. Row with empty parts[] and non-empty top-level partNumber
	it("treats row with empty parts[] and non-empty partNumber as 1-part row", () => {
		const row = makeRow({
			id: "r1",
			model: "Land Cruiser",
			parts: [],
			partNumber: "TOP-PN",
			description: "Top Desc",
			quantity: 5,
		});
		const result = computeLostSalesReport([row], ALL_FILTERS);
		expect(result.kpis.distinctParts).toBe(1);
		expect(result.topParts[0]).toMatchObject({
			partNumber: "TOP-PN",
			description: "Top Desc",
			orderCount: 1,
			totalQuantity: 5,
		});
	});

	// 9. Row with empty parts[] AND empty partNumber
	it("excludes row from parts aggregation when parts[] is empty and partNumber is empty", () => {
		const row = makeRow({
			id: "r1",
			model: "Fortuner",
			parts: [],
			partNumber: "",
			description: "",
			quantity: undefined,
		});
		const result = computeLostSalesReport([row], ALL_FILTERS);
		expect(result.kpis.totalOrders).toBe(1);
		expect(result.kpis.distinctParts).toBe(0);
		expect(result.topParts).toHaveLength(0);
	});

	// 10. Model demand grouping
	it("groups model demand correctly and sums quantities", () => {
		const rows = [
			makeRow({
				id: "r1",
				model: "Prado",
				company: "Alpha",
				parts: [
					{
						id: "p1",
						partNumber: "PN-1",
						description: "D1",
						quantity: 3,
						rowId: "r1",
					},
					{
						id: "p2",
						partNumber: "PN-2",
						description: "D2",
						quantity: 2,
						rowId: "r1",
					},
				],
			}),
			makeRow({
				id: "r2",
				model: "Prado",
				company: "Alpha",
				parts: [
					{
						id: "p3",
						partNumber: "PN-3",
						description: "D3",
						quantity: 4,
						rowId: "r2",
					},
				],
			}),
			makeRow({
				id: "r3",
				model: "Hilux",
				company: "Alpha",
				parts: [
					{
						id: "p4",
						partNumber: "PN-4",
						description: "D4",
						quantity: 1,
						rowId: "r3",
					},
				],
			}),
		];
		const result = computeLostSalesReport(rows, ALL_FILTERS);
		expect(result.modelDemand).toHaveLength(2);
		const prado = result.modelDemand.find((m) => m.model === "Prado");
		expect(prado).toMatchObject({ orderCount: 2, totalQuantity: 9 });
		const hilux = result.modelDemand.find((m) => m.model === "Hilux");
		expect(hilux).toMatchObject({ orderCount: 1, totalQuantity: 1 });
	});

	// 11. Sorting: orderCount desc, tie broken by totalQuantity desc
	it("sorts topParts by orderCount desc then totalQuantity desc", () => {
		const rows = [
			// PN-HIGH: orderCount=2, totalQuantity=10
			makeRow({
				id: "r1",
				model: "A",
				parts: [
					{
						id: "p1",
						partNumber: "PN-HIGH",
						description: "H",
						quantity: 6,
						rowId: "r1",
					},
				],
			}),
			makeRow({
				id: "r2",
				model: "A",
				parts: [
					{
						id: "p2",
						partNumber: "PN-HIGH",
						description: "H",
						quantity: 4,
						rowId: "r2",
					},
				],
			}),
			// PN-LOW: orderCount=1, totalQuantity=20
			makeRow({
				id: "r3",
				model: "A",
				parts: [
					{
						id: "p3",
						partNumber: "PN-LOW",
						description: "L",
						quantity: 20,
						rowId: "r3",
					},
				],
			}),
			// PN-TIE-A: orderCount=2, totalQuantity=5
			makeRow({
				id: "r4",
				model: "A",
				parts: [
					{
						id: "p4",
						partNumber: "PN-TIE-A",
						description: "TA",
						quantity: 3,
						rowId: "r4",
					},
				],
			}),
			makeRow({
				id: "r5",
				model: "A",
				parts: [
					{
						id: "p5",
						partNumber: "PN-TIE-A",
						description: "TA",
						quantity: 2,
						rowId: "r5",
					},
				],
			}),
		];
		const result = computeLostSalesReport(rows, ALL_FILTERS);
		const partNumbers = result.topParts.map((p) => p.partNumber);
		// PN-HIGH and PN-TIE-A both have orderCount=2; PN-HIGH has higher totalQuantity
		expect(partNumbers[0]).toBe("PN-HIGH");
		expect(partNumbers[1]).toBe("PN-TIE-A");
		// PN-LOW has orderCount=1, comes last
		expect(partNumbers[2]).toBe("PN-LOW");
	});
});
