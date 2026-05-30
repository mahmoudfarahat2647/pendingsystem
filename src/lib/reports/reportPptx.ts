import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { periodLabel } from "@/lib/reports/reportFormatUtils";

// Brand theme constants — pptxgenjs uses hex strings without the '#' prefix
const BG_COLOR = "0a0a0b";
const ACCENT = "FFCC00";
const TEXT_WHITE = "FFFFFF";
const TEXT_SECONDARY = "9ca3af";
const BORDER_COLOR = "333333";
const ROW_ALT_BG = "18181b";

function todayString(): string {
	return new Date().toLocaleDateString();
}

function fileNameDate(): string {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export async function exportLostSalesPptx(
	report: LostSalesReport,
	filters: LostSalesFilters,
): Promise<void> {
	const PptxGenJS = (await import("pptxgenjs")).default;
	const pptx = new PptxGenJS();

	// Wide 16:9 layout (13.33 × 7.5 inches)
	pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.33, height: 7.5 });
	pptx.layout = "LAYOUT_WIDE";

	// ─────────────────────────────────────────────────────────────────────────
	// Slide 1 — Title
	// ─────────────────────────────────────────────────────────────────────────
	const slide1 = pptx.addSlide();
	slide1.background = { color: BG_COLOR };

	// Decorative accent bar
	slide1.addShape(pptx.ShapeType.rect, {
		x: 0,
		y: 0,
		w: 13.33,
		h: 0.08,
		fill: { color: ACCENT },
		line: { color: ACCENT },
	});

	// Title
	slide1.addText("Lost Sales Report", {
		x: 0.7,
		y: 1.2,
		w: 12,
		h: 1.2,
		fontSize: 44,
		bold: true,
		color: ACCENT,
		fontFace: "Arial",
	});

	// Subtitle
	slide1.addText("EiM — Egyptian International Motors", {
		x: 0.7,
		y: 2.5,
		w: 12,
		h: 0.6,
		fontSize: 20,
		color: TEXT_WHITE,
		fontFace: "Arial",
	});

	// KPIs row
	const { kpis } = report;
	const kpiLine = `Total Orders: ${kpis.totalOrders}   |   Distinct Parts: ${kpis.distinctParts}   |   Total Qty: ${kpis.totalQuantity}   |   Distinct Models: ${kpis.distinctModels}`;
	slide1.addText(kpiLine, {
		x: 0.7,
		y: 3.4,
		w: 12,
		h: 0.5,
		fontSize: 13,
		color: TEXT_WHITE,
		fontFace: "Arial",
		bold: true,
	});

	// Filter info
	const companyText = filters.company
		? `Company: ${filters.company}`
		: "Company: All";
	const periodText = `Period: ${periodLabel(filters.period)}`;
	slide1.addText(`${companyText}   |   ${periodText}`, {
		x: 0.7,
		y: 4.1,
		w: 12,
		h: 0.4,
		fontSize: 11,
		color: TEXT_SECONDARY,
		fontFace: "Arial",
	});

	// Date
	slide1.addText(`Generated: ${todayString()}`, {
		x: 0.7,
		y: 4.65,
		w: 12,
		h: 0.35,
		fontSize: 10,
		color: TEXT_SECONDARY,
		fontFace: "Arial",
		italic: true,
	});

	// Bottom accent bar
	slide1.addShape(pptx.ShapeType.rect, {
		x: 0,
		y: 7.42,
		w: 13.33,
		h: 0.08,
		fill: { color: ACCENT },
		line: { color: ACCENT },
	});

	// ─────────────────────────────────────────────────────────────────────────
	// Slide 2 — Top In-Demand Parts (Horizontal Bar Chart)
	// ─────────────────────────────────────────────────────────────────────────
	const slide2 = pptx.addSlide();
	slide2.background = { color: BG_COLOR };

	slide2.addShape(pptx.ShapeType.rect, {
		x: 0,
		y: 0,
		w: 13.33,
		h: 0.08,
		fill: { color: ACCENT },
		line: { color: ACCENT },
	});

	slide2.addText("Top In-Demand Parts", {
		x: 0.5,
		y: 0.2,
		w: 12,
		h: 0.7,
		fontSize: 22,
		bold: true,
		color: TEXT_WHITE,
		fontFace: "Arial",
	});

	const top15Parts = report.topParts.slice(0, 15);

	if (top15Parts.length === 0) {
		slide2.addText("No data available for the selected filters.", {
			x: 0.5,
			y: 3.0,
			w: 12,
			h: 1,
			fontSize: 16,
			color: TEXT_SECONDARY,
			fontFace: "Arial",
			align: "center",
		});
	} else {
		const partLabels = top15Parts.map((p) => p.partNumber);
		const partValues = top15Parts.map((p) => p.orderCount);

		const partsChartData = [
			{
				name: "Order Count",
				labels: partLabels,
				values: partValues,
			},
		];

		slide2.addChart(pptx.ChartType.bar, partsChartData, {
			x: 0.5,
			y: 1.1,
			w: 12,
			h: 5.9,
			barDir: "bar",
			chartColors: [ACCENT],
			showTitle: false,
			showLegend: false,
			catAxisLabelColor: TEXT_SECONDARY,
			valAxisLabelColor: TEXT_SECONDARY,
			catAxisLabelFontSize: 8,
			valAxisLabelFontSize: 8,
			dataLabelColor: BG_COLOR,
		});
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Slide 3 — Demand by Car Model (Horizontal Bar Chart)
	// ─────────────────────────────────────────────────────────────────────────
	const slide3 = pptx.addSlide();
	slide3.background = { color: BG_COLOR };

	slide3.addShape(pptx.ShapeType.rect, {
		x: 0,
		y: 0,
		w: 13.33,
		h: 0.08,
		fill: { color: ACCENT },
		line: { color: ACCENT },
	});

	slide3.addText("Demand by Car Model", {
		x: 0.5,
		y: 0.2,
		w: 12,
		h: 0.7,
		fontSize: 22,
		bold: true,
		color: TEXT_WHITE,
		fontFace: "Arial",
	});

	const top10Models = report.modelDemand.slice(0, 10);

	if (top10Models.length === 0) {
		slide3.addText("No data available for the selected filters.", {
			x: 0.5,
			y: 3.0,
			w: 12,
			h: 1,
			fontSize: 16,
			color: TEXT_SECONDARY,
			fontFace: "Arial",
			align: "center",
		});
	} else {
		const modelLabels = top10Models.map((m) =>
			m.company ? `${m.model} (${m.company})` : m.model,
		);
		const modelValues = top10Models.map((m) => m.orderCount);

		const modelsChartData = [
			{
				name: "Order Count",
				labels: modelLabels,
				values: modelValues,
			},
		];

		slide3.addChart(pptx.ChartType.bar, modelsChartData, {
			x: 0.5,
			y: 1.1,
			w: 12,
			h: 5.9,
			barDir: "bar",
			chartColors: [ACCENT],
			showTitle: false,
			showLegend: false,
			catAxisLabelColor: TEXT_SECONDARY,
			valAxisLabelColor: TEXT_SECONDARY,
			catAxisLabelFontSize: 9,
			valAxisLabelFontSize: 9,
			dataLabelColor: BG_COLOR,
		});
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Slide 4 — Top Parts Data Table
	// ─────────────────────────────────────────────────────────────────────────
	const slide4 = pptx.addSlide();
	slide4.background = { color: BG_COLOR };

	slide4.addShape(pptx.ShapeType.rect, {
		x: 0,
		y: 0,
		w: 13.33,
		h: 0.08,
		fill: { color: ACCENT },
		line: { color: ACCENT },
	});

	slide4.addText("Top Parts — Detail Table", {
		x: 0.5,
		y: 0.2,
		w: 12,
		h: 0.7,
		fontSize: 22,
		bold: true,
		color: TEXT_WHITE,
		fontFace: "Arial",
	});

	const top20Parts = report.topParts.slice(0, 20);

	if (top20Parts.length === 0) {
		slide4.addText("No data available for the selected filters.", {
			x: 0.5,
			y: 3.0,
			w: 12,
			h: 1,
			fontSize: 16,
			color: TEXT_SECONDARY,
			fontFace: "Arial",
			align: "center",
		});
	} else {
		// Header row
		type TableCell = {
			text: string;
			options?: {
				bold?: boolean;
				color?: string;
				fill?: { color: string };
				align?: "left" | "center" | "right";
			};
		};

		const headerRow: TableCell[] = [
			{
				text: "Part Number",
				options: {
					bold: true,
					color: BG_COLOR,
					fill: { color: ACCENT },
					align: "left",
				},
			},
			{
				text: "Description",
				options: {
					bold: true,
					color: BG_COLOR,
					fill: { color: ACCENT },
					align: "left",
				},
			},
			{
				text: "Order Count",
				options: {
					bold: true,
					color: BG_COLOR,
					fill: { color: ACCENT },
					align: "center",
				},
			},
			{
				text: "Total Quantity",
				options: {
					bold: true,
					color: BG_COLOR,
					fill: { color: ACCENT },
					align: "center",
				},
			},
		];

		const dataRows: TableCell[][] = top20Parts.map((part, index) => {
			const rowBg = index % 2 === 0 ? BG_COLOR : ROW_ALT_BG;
			return [
				{
					text: part.partNumber,
					options: { color: TEXT_WHITE, fill: { color: rowBg }, align: "left" },
				},
				{
					text: part.description || "—",
					options: { color: TEXT_WHITE, fill: { color: rowBg }, align: "left" },
				},
				{
					text: String(part.orderCount),
					options: { color: ACCENT, fill: { color: rowBg }, align: "center" },
				},
				{
					text: String(part.totalQuantity),
					options: {
						color: TEXT_WHITE,
						fill: { color: rowBg },
						align: "center",
					},
				},
			];
		});

		const tableRows = [headerRow, ...dataRows];

		slide4.addTable(tableRows, {
			x: 0.5,
			y: 1.1,
			w: 12.3,
			colW: [2.2, 6.0, 2.0, 2.1],
			border: { type: "solid", pt: 0.5, color: BORDER_COLOR },
			fontFace: "Arial",
			fontSize: 9,
			color: TEXT_WHITE,
			rowH: 0.28,
		});
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Write file
	// ─────────────────────────────────────────────────────────────────────────
	await pptx.writeFile({ fileName: `LostSales_Report_${fileNameDate()}.pptx` });
}
