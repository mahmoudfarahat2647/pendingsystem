import type { LostSalesFilters } from "@/domain/reports/lostSalesAnalysis";

export function periodLabel(period: LostSalesFilters["period"]): string {
	if (period === "last30") return "Last 30 days";
	if (period === "last90") return "Last 90 days";
	return "All time";
}
