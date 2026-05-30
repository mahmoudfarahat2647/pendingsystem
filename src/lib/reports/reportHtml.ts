import type {
	LostSalesFilters,
	LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { periodLabel } from "@/lib/reports/reportFormatUtils";

function esc(val: unknown): string {
	return String(val ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function companyLabel(company: string | null): string {
	return company === null ? "All companies" : company;
}

function buildStyles(): string {
	return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0b;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      padding: 32px 16px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    a { color: #FFCC00; }

    /* Header */
    .header { margin-bottom: 32px; border-bottom: 1px solid #2a2a2c; padding-bottom: 24px; }
    .header-logo { font-size: 28px; font-weight: 900; color: #FFCC00; letter-spacing: -0.5px; margin-bottom: 4px; }
    .header-title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
    .header-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 16px; flex-wrap: wrap; }
    .header-meta span { display: flex; align-items: center; gap: 4px; }
    .header-meta .label { color: #6b7280; }

    /* KPI strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }
    .kpi-card {
      background: #111113;
      border: 1px solid #2a2a2c;
      border-radius: 8px;
      padding: 20px;
    }
    .kpi-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
    .kpi-value { font-size: 32px; font-weight: 700; color: #FFCC00; }

    /* Section */
    .section { margin-bottom: 48px; }
    .section-heading {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid #2a2a2c;
    }

    /* Bar chart */
    .bar-chart { display: flex; flex-direction: column; gap: 6px; margin-bottom: 28px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label {
      width: 260px;
      flex-shrink: 0;
      font-size: 12px;
      color: #d1d5db;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bar-track {
      flex: 1;
      background: #1a1a1b;
      border-radius: 4px;
      overflow: hidden;
      height: 24px;
    }
    .bar-fill {
      height: 24px;
      border-radius: 4px;
      background: #FFCC00;
      transition: width 0.3s;
    }
    .bar-value { width: 48px; flex-shrink: 0; text-align: right; font-size: 12px; font-weight: 600; color: #FFCC00; }
    .no-data { color: #6b7280; font-style: italic; padding: 12px 0; }

    /* Table */
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th {
      text-align: left;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
      background: #111113;
      border-bottom: 1px solid #2a2a2c;
    }
    .data-table td { padding: 9px 12px; color: #d1d5db; border-bottom: 1px solid #1a1a1b; }
    .data-table tr:nth-child(even) td { background: #0d0d0f; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table td.num { text-align: right; color: #ffffff; font-variant-numeric: tabular-nums; }
    .data-table td.idx { color: #6b7280; width: 36px; }
    .data-table td.highlight { color: #FFCC00; font-weight: 600; }
    .table-wrap { background: #111113; border: 1px solid #2a2a2c; border-radius: 8px; overflow: hidden; }

    /* Footer */
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #2a2a2c; font-size: 11px; color: #6b7280; text-align: center; }
  `;
}

function buildPartsBarChart(topParts: LostSalesReport["topParts"]): string {
	if (topParts.length === 0) return `<p class="no-data">No data available</p>`;
	const chartItems = topParts.slice(0, 15);
	const max = chartItems[0]?.orderCount ?? 1;
	const rows = chartItems
		.map((p) => {
			const pct = max > 0 ? Math.round((p.orderCount / max) * 100) : 0;
			const label = p.description
				? `${esc(p.partNumber)} — ${esc(p.description)}`
				: esc(p.partNumber);
			return `
        <div class="bar-row">
          <div class="bar-label" title="${esc(p.partNumber)} ${esc(p.description)}">${label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="bar-value">${esc(p.orderCount)}</div>
        </div>`;
		})
		.join("");
	return `<div class="bar-chart">${rows}</div>`;
}

function buildPartsTable(topParts: LostSalesReport["topParts"]): string {
	if (topParts.length === 0) return `<p class="no-data">No data available</p>`;
	const rows = topParts
		.map(
			(p, i) => `
      <tr>
        <td class="idx">${i + 1}</td>
        <td class="highlight">${esc(p.partNumber)}</td>
        <td>${esc(p.description)}</td>
        <td class="num">${esc(p.orderCount)}</td>
        <td class="num">${esc(p.totalQuantity)}</td>
      </tr>`,
		)
		.join("");
	return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
            <th style="text-align:right">Order Count</th>
            <th style="text-align:right">Total Qty</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildModelsBarChart(
	modelDemand: LostSalesReport["modelDemand"],
): string {
	if (modelDemand.length === 0)
		return `<p class="no-data">No data available</p>`;
	const chartItems = modelDemand.slice(0, 10);
	const max = chartItems[0]?.orderCount ?? 1;
	const rows = chartItems
		.map((m) => {
			const pct = max > 0 ? Math.round((m.orderCount / max) * 100) : 0;
			const label = m.company
				? `${esc(m.model)} (${esc(m.company)})`
				: esc(m.model);
			return `
        <div class="bar-row">
          <div class="bar-label" title="${esc(m.model)} ${esc(m.company)}">${label}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="bar-value">${esc(m.orderCount)}</div>
        </div>`;
		})
		.join("");
	return `<div class="bar-chart">${rows}</div>`;
}

function buildModelsTable(modelDemand: LostSalesReport["modelDemand"]): string {
	if (modelDemand.length === 0)
		return `<p class="no-data">No data available</p>`;
	const rows = modelDemand
		.map(
			(m, i) => `
      <tr>
        <td class="idx">${i + 1}</td>
        <td class="highlight">${esc(m.model)}</td>
        <td>${esc(m.company)}</td>
        <td class="num">${esc(m.orderCount)}</td>
        <td class="num">${esc(m.totalQuantity)}</td>
      </tr>`,
		)
		.join("");
	return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Model</th>
            <th>Company</th>
            <th style="text-align:right">Order Count</th>
            <th style="text-align:right">Total Qty</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function generateLostSalesHtml(
	report: LostSalesReport,
	filters: LostSalesFilters,
): string {
	const { kpis, topParts, modelDemand } = report;
	const now = new Date();
	const isoDate = now.toISOString().slice(0, 10);
	const displayDate = now.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lost Sales Report — EiM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>${buildStyles()}</style>
</head>
<body>
  <div class="container">

    <header class="header">
      <div class="header-logo">EiM</div>
      <div class="header-title">Lost Sales Report</div>
      <div class="header-meta">
        <span><span class="label">Generated:</span> ${esc(displayDate)}</span>
        <span><span class="label">Period:</span> ${esc(periodLabel(filters.period))}</span>
        <span><span class="label">Company:</span> ${esc(companyLabel(filters.company))}</span>
      </div>
    </header>

    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Total Orders</div>
        <div class="kpi-value">${esc(kpis.totalOrders)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Distinct Parts</div>
        <div class="kpi-value">${esc(kpis.distinctParts)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Quantity</div>
        <div class="kpi-value">${esc(kpis.totalQuantity)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Distinct Models</div>
        <div class="kpi-value">${esc(kpis.distinctModels)}</div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-heading">Top Demanded Parts</h2>
      ${buildPartsBarChart(topParts)}
      ${buildPartsTable(topParts)}
    </section>

    <section class="section">
      <h2 class="section-heading">Demand by Car Model</h2>
      ${buildModelsBarChart(modelDemand)}
      ${buildModelsTable(modelDemand)}
    </section>

    <footer class="footer">
      Generated by PendingSystem &bull; EiM Body &amp; Paint &bull; ${esc(isoDate)}
    </footer>

  </div>
</body>
</html>`;
}
