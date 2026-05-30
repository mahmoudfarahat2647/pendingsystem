import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { periodLabel } from "@/lib/reports/reportFormatUtils";

function escapeTex(val: unknown): string {
	return String(val ?? "")
		.replace(/\\/g, "\\textbackslash{}")
		.replace(/&/g, "\\&")
		.replace(/%/g, "\\%")
		.replace(/\$/g, "\\$")
		.replace(/#/g, "\\#")
		.replace(/_/g, "\\_")
		.replace(/\{/g, "\\{")
		.replace(/\}/g, "\\}")
		.replace(/~/g, "\\textasciitilde{}")
		.replace(/\^/g, "\\textasciicircum{}");
}

function buildTexDocument(
	report: LostSalesReport,
	filters: LostSalesFilters,
	generatedDate: string,
): string {
	const { kpis, topParts, modelDemand } = report;
	const companyDisplay = filters.company ? escapeTex(filters.company) : "All";
	const periodDisplay = escapeTex(periodLabel(filters.period));
	const dateDisplay = escapeTex(generatedDate);

	const partRows = topParts
		.map(
			(p) =>
				`${escapeTex(p.partNumber)} & ${escapeTex(p.description)} & ${p.orderCount} & ${p.totalQuantity} \\\\`,
		)
		.join("\n");

	const modelRows = modelDemand
		.map(
			(m) =>
				`${escapeTex(m.model)} & ${escapeTex(m.company)} & ${m.orderCount} & ${m.totalQuantity} \\\\`,
		)
		.join("\n");

	return `\\documentclass[a4paper,11pt]{article}
\\usepackage{geometry}
\\geometry{margin=2cm}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{xcolor}
\\definecolor{eim}{HTML}{FFCC00}

\\title{Lost Sales Report --- EiM Body \\& Paint}
\\author{PendingSystem}
\\date{${dateDisplay}}

\\begin{document}
\\maketitle

\\section*{Filters}
Company: ${companyDisplay} \\\\
Period: ${periodDisplay} \\\\
Generated: ${dateDisplay}

\\section*{Summary}
\\begin{tabular}{ll}
\\toprule
Metric & Value \\\\
\\midrule
Total Orders & ${kpis.totalOrders} \\\\
Distinct Parts & ${kpis.distinctParts} \\\\
Total Quantity & ${kpis.totalQuantity} \\\\
Distinct Models & ${kpis.distinctModels} \\\\
\\bottomrule
\\end{tabular}

\\section*{Top In-Demand Parts}
\\begin{longtable}{p{3cm} p{7cm} r r}
\\toprule
Part Number & Description & Order Count & Total Qty \\\\
\\midrule
\\endhead
${partRows}
\\bottomrule
\\end{longtable}

\\section*{Demand by Car Model}
\\begin{longtable}{p{5cm} p{4cm} r r}
\\toprule
Model & Company & Order Count & Total Qty \\\\
\\midrule
\\endhead
${modelRows}
\\bottomrule
\\end{longtable}

\\end{document}
`;
}

export function exportLostSalesLatex(
	report: LostSalesReport,
	filters: LostSalesFilters,
): void {
	const generatedDate = new Date().toISOString().split("T")[0];
	const texContent = buildTexDocument(report, filters, generatedDate);

	const blob = new Blob([texContent], { type: "application/x-tex" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);

	link.setAttribute("href", url);
	link.setAttribute("download", `LostSales_Report_${generatedDate}.tex`);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	URL.revokeObjectURL(url);
	document.body.removeChild(link);
}
