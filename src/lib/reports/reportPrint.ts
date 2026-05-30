import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { generateLostSalesHtml } from "@/lib/reports/reportHtml";

export function printLostSalesReport(
	report: LostSalesReport,
	filters: LostSalesFilters,
): void {
	const html = generateLostSalesHtml(report, filters);

	const printWindow = window.open("", "_blank");
	if (!printWindow) {
		throw new Error(
			"Popup blocked. Please allow popups for this site to use Print to PDF.",
		);
	}

	printWindow.document.write(html);
	printWindow.document.close();

	printWindow.onload = () => {
		printWindow.focus();
		printWindow.print();
	};
}
