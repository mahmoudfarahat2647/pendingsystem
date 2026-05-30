import type { PendingRow } from "@/types";

export interface PartDemand {
	partNumber: string;
	description: string;
	orderCount: number;
	totalQuantity: number;
	models: string[];
}

export interface ModelDemand {
	model: string;
	company: string;
	orderCount: number;
	totalQuantity: number;
}

export interface LostSalesKpis {
	totalOrders: number;
	distinctParts: number;
	totalQuantity: number;
	distinctModels: number;
}

export interface LostSalesReport {
	kpis: LostSalesKpis;
	topParts: PartDemand[];
	modelDemand: ModelDemand[];
}

export type LostSalesCompanyFilter = string | null;
export type LostSalesPeriodFilter = "all" | "last30" | "last90";

export interface LostSalesFilters {
	company: LostSalesCompanyFilter;
	period: LostSalesPeriodFilter;
}

function normalizeModelCompany(model: string, rawCompany: string): string {
	if (/^ZEEKR\b/i.test(model)) return "Zeekr";
	return rawCompany;
}

function isWithinDays(
	isoDate: string | undefined | null,
	days: number,
): boolean {
	if (!isoDate) return false;
	const ts = Date.parse(isoDate);
	if (Number.isNaN(ts)) return false;
	const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
	return ts >= cutoff;
}

function getEffectiveParts(
	row: PendingRow,
): Array<{ partNumber: string; description: string; quantity: number }> {
	if (row.parts.length > 0) {
		return row.parts.map((p) => ({
			partNumber: p.partNumber,
			description: p.description,
			quantity: p.quantity,
		}));
	}
	// Fallback to top-level fields only when parts[] is empty and partNumber is non-empty
	const pn = row.partNumber ?? "";
	if (pn === "") return [];
	return [
		{
			partNumber: pn,
			description: row.description ?? "",
			quantity: row.quantity ?? 1,
		},
	];
}

export function computeLostSalesReport(
	rows: PendingRow[],
	filters: LostSalesFilters,
): LostSalesReport {
	// --- filtering ---
	let filtered = rows;

	if (filters.company !== null) {
		filtered = filtered.filter(
			(r) =>
				normalizeModelCompany(r.model, r.company ?? "") === filters.company,
		);
	}

	if (filters.period !== "all") {
		const days = filters.period === "last30" ? 30 : 90;
		filtered = filtered.filter((r) => isWithinDays(r.createdAt, days));
	}

	// --- part demand aggregation ---
	const partMap = new Map<
		string,
		{
			description: string;
			orderCount: number;
			totalQuantity: number;
			rowIds: Set<string>;
			modelSet: Set<string>;
		}
	>();

	for (const row of filtered) {
		const parts = getEffectiveParts(row);
		for (const part of parts) {
			if (part.partNumber === "") continue;
			const existing = partMap.get(part.partNumber);
			if (existing) {
				// orderCount tracks distinct rows, not part entries within a row
				if (!existing.rowIds.has(row.id)) {
					existing.orderCount += 1;
					existing.rowIds.add(row.id);
				}
				existing.totalQuantity += part.quantity;
				if (row.model) existing.modelSet.add(row.model);
			} else {
				partMap.set(part.partNumber, {
					description: part.description,
					orderCount: 1,
					totalQuantity: part.quantity,
					rowIds: new Set([row.id]),
					modelSet: new Set(row.model ? [row.model] : []),
				});
			}
		}
	}

	const topParts: PartDemand[] = Array.from(partMap.entries())
		.map(([partNumber, data]) => ({
			partNumber,
			description: data.description,
			orderCount: data.orderCount,
			totalQuantity: data.totalQuantity,
			models: Array.from(data.modelSet).sort(),
		}))
		.sort((a, b) =>
			b.orderCount !== a.orderCount
				? b.orderCount - a.orderCount
				: b.totalQuantity - a.totalQuantity,
		);

	// --- model demand aggregation ---
	const modelMap = new Map<
		string,
		{
			model: string;
			company: string;
			orderCount: number;
			totalQuantity: number;
		}
	>();

	for (const row of filtered) {
		if (row.model === "") continue;
		const company = normalizeModelCompany(row.model, row.company ?? "");
		const key = `${row.model}\0${company}`;
		const rowQty = getEffectiveParts(row).reduce(
			(sum, p) => sum + p.quantity,
			0,
		);
		const existing = modelMap.get(key);
		if (existing) {
			existing.orderCount += 1;
			existing.totalQuantity += rowQty;
		} else {
			modelMap.set(key, {
				model: row.model,
				company,
				orderCount: 1,
				totalQuantity: rowQty,
			});
		}
	}

	const modelDemand: ModelDemand[] = Array.from(modelMap.values()).sort(
		(a, b) => b.orderCount - a.orderCount,
	);

	// --- KPIs ---
	const totalQuantity = topParts.reduce((sum, p) => sum + p.totalQuantity, 0);

	const kpis: LostSalesKpis = {
		totalOrders: filtered.length,
		distinctParts: topParts.length,
		totalQuantity,
		distinctModels: modelDemand.length,
	};

	return { kpis, topParts, modelDemand };
}
