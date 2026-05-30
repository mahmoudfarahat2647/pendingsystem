"use client";

import {
	Download,
	FileSpreadsheet,
	FileText,
	Loader2,
	Presentation,
	Printer,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { logger } from "@/lib/logger";
import { exportLostSalesExcel } from "@/lib/reports/reportExcel";
import { generateLostSalesHtml } from "@/lib/reports/reportHtml";
import { exportLostSalesLatex } from "@/lib/reports/reportLatex";
import { exportLostSalesPptx } from "@/lib/reports/reportPptx";
import { printLostSalesReport } from "@/lib/reports/reportPrint";

interface ReportExportMenuProps {
	report: LostSalesReport;
	filters: LostSalesFilters;
	disabled?: boolean;
}

function downloadHtml(
	report: LostSalesReport,
	filters: LostSalesFilters,
): void {
	const html = generateLostSalesHtml(report, filters);
	const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.setAttribute("href", url);
	link.setAttribute(
		"download",
		`LostSales_Report_${new Date().toISOString().split("T")[0]}.html`,
	);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	URL.revokeObjectURL(url);
	document.body.removeChild(link);
}

export function ReportExportMenu({
	report,
	filters,
	disabled,
}: ReportExportMenuProps) {
	const [excelLoading, setExcelLoading] = useState(false);
	const [pptxLoading, setPptxLoading] = useState(false);

	const buttonClassName =
		"border-white/10 text-gray-300 hover:text-white hover:bg-white/10 bg-white/5 gap-2 text-xs";

	async function handleExcel(): Promise<void> {
		if (excelLoading) return;
		setExcelLoading(true);
		try {
			await exportLostSalesExcel(report, filters);
		} catch (e) {
			logger.error("Excel export failed", e);
			toast.error("Failed to export Excel report. Please try again.");
		} finally {
			setExcelLoading(false);
		}
	}

	async function handlePptx(): Promise<void> {
		if (pptxLoading) return;
		setPptxLoading(true);
		try {
			await exportLostSalesPptx(report, filters);
		} catch (e) {
			logger.error("PowerPoint export failed", e);
			toast.error("Failed to export PowerPoint report. Please try again.");
		} finally {
			setPptxLoading(false);
		}
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<Button
				variant="outline"
				className={buttonClassName}
				disabled={disabled}
				onClick={() => {
					try {
						printLostSalesReport(report, filters);
					} catch (e) {
						logger.error("Print export failed", e);
						toast.error("Failed to print report. Please try again.");
					}
				}}
			>
				<Printer className="h-3.5 w-3.5" />
				PDF
			</Button>

			<Button
				variant="outline"
				className={buttonClassName}
				disabled={disabled || excelLoading}
				onClick={handleExcel}
			>
				{excelLoading ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<FileSpreadsheet className="h-3.5 w-3.5" />
				)}
				Excel
			</Button>

			<Button
				variant="outline"
				className={buttonClassName}
				disabled={disabled}
				onClick={() => {
					try {
						downloadHtml(report, filters);
					} catch (e) {
						logger.error("HTML export failed", e);
						toast.error("Failed to export HTML report. Please try again.");
					}
				}}
			>
				<FileText className="h-3.5 w-3.5" />
				HTML
			</Button>

			<Button
				variant="outline"
				className={buttonClassName}
				disabled={disabled || pptxLoading}
				onClick={handlePptx}
			>
				{pptxLoading ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Presentation className="h-3.5 w-3.5" />
				)}
				PowerPoint
			</Button>

			<Button
				variant="outline"
				className={buttonClassName}
				disabled={disabled}
				onClick={() => {
					try {
						exportLostSalesLatex(report, filters);
					} catch (e) {
						logger.error("LaTeX export failed", e);
						toast.error("Failed to export LaTeX report. Please try again.");
					}
				}}
			>
				<Download className="h-3.5 w-3.5" />
				LaTeX
			</Button>
		</div>
	);
}
