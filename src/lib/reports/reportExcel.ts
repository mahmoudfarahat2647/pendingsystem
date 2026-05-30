import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { periodLabel } from "@/lib/reports/reportFormatUtils";

export async function exportLostSalesExcel(
	report: LostSalesReport,
	filters: LostSalesFilters,
): Promise<void> {
	const XLSX = await import("xlsx");

	const workbook = XLSX.utils.book_new();

	// --- Summary sheet ---
	const summaryData: Array<Record<string, string | number>> = [
		{ Metric: "Total Orders", Value: report.kpis.totalOrders },
		{ Metric: "Distinct Parts", Value: report.kpis.distinctParts },
		{ Metric: "Total Quantity", Value: report.kpis.totalQuantity },
		{ Metric: "Distinct Models", Value: report.kpis.distinctModels },
		{ Metric: "Company Filter", Value: filters.company ?? "All" },
		{ Metric: "Period Filter", Value: periodLabel(filters.period) },
		{ Metric: "Generated At", Value: new Date().toISOString() },
	];
	const summarySheet = XLSX.utils.json_to_sheet(summaryData);
	summarySheet["!cols"] = [{ wch: 20 }, { wch: 40 }];
	XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

	// --- Top Parts sheet ---
	const topPartsData = report.topParts.map((p) => ({
		"Part Number": p.partNumber,
		Description: p.description,
		"Order Count": p.orderCount,
		"Total Quantity": p.totalQuantity,
	}));
	const topPartsSheet = XLSX.utils.json_to_sheet(topPartsData);
	topPartsSheet["!cols"] = [{ wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
	XLSX.utils.book_append_sheet(workbook, topPartsSheet, "Top Parts");

	// --- Model Demand sheet ---
	const modelDemandData = report.modelDemand.map((m) => ({
		Model: m.model,
		Company: m.company,
		"Order Count": m.orderCount,
		"Total Quantity": m.totalQuantity,
	}));
	const modelDemandSheet = XLSX.utils.json_to_sheet(modelDemandData);
	modelDemandSheet["!cols"] = [
		{ wch: 20 },
		{ wch: 40 },
		{ wch: 15 },
		{ wch: 15 },
	];
	XLSX.utils.book_append_sheet(workbook, modelDemandSheet, "Model Demand");

	const filename = `LostSales_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
	XLSX.writeFile(workbook, filename);
}
