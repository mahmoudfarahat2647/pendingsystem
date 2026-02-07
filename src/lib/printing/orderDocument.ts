import type { PendingRow } from "@/types";

/**
 * @module OrderDocumentPrinter
 * @description Professional spare parts order document generator for Egyptian International Motors (EiM)
 *
 * ## Purpose
 * Generates official A4 order request forms (نموذج طلب قطع غيار غير متوفرة) for unavailable spare parts.
 * These documents are used for formal procurement and workshop approval processes.
 *
 * ## Features
 * - **VIN Grouping**: Automatically groups orders by vehicle (VIN) for organized processing
 * - **3-Column Grid**: Displays up to 18 parts per page (6 parts × 3 columns)
 * - **RTL Layout**: Arabic-first design with proper right-to-left text flow
 * - **Dual Typography**: Cairo font for Arabic, Inter for technical data (VIN, Part Numbers)
 * - **Signature Sections**: Dedicated approval areas for workshop manager and parts supervisor
 *
 * ## Document Structure
 * - Header: EiM branding + current date
 * - Title: "نموذج طلب قطع غيار غير متوفرة"
 * - Customer/Vehicle Information Section
 * - Parts Grid (3 columns)
 * - Footer: Notes, approval stamps, and signatures
 *
 * @author pendingsystem Development Team
 * @since 2025-12-25
 */

/**
 * Prints spare parts order documents grouped by VIN
 *
 * @param {PendingRow[]} selected - Array of selected pending rows to print
 * @returns {void}
 *
 * @remarks
 * - Each unique VIN generates a separate page
 * - Maximum 18 parts per page (dictated by 3-column × 6-row grid)
 * - Documents open in new window for isolated printing
 *
 * @example
 * ```typescript
 * // Print orders for selected rows
 * const selectedOrders = [...];
 * printOrderDocument(selectedOrders);
 * ```
 */
/**
 * Checks if a part is in stock based on its partStatus.
 *
 * @param {string} [status] - The status label of the part
 * @returns {boolean} True if status indicates part is in stock
 */
const isPartInStock = (status?: string): boolean => {
	if (!status) return false;
	const inStockStatuses = ["arrived", "reserve", "labeled", "available"];
	const normalized = status.toLowerCase().trim();
	return inStockStatuses.includes(normalized);
};

export const printOrderDocument = (selected: PendingRow[]): void => {
	// Validation: Ensure orders are selected
	if (selected.length === 0) {
		alert("Please select orders to print.");
		return;
	}

	// Group orders by VIN to generate one page per vehicle
	const grouped: Record<string, PendingRow[]> = {};
	selected.forEach((row) => {
		const key = row.vin || "Unknown";
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(row);
	});

	// Open new window for print-isolated context
	const printWindow = window.open("", "_blank");
	if (!printWindow) return;

	// Build complete HTML document
	let htmlContent = `
        <html>
        <head>
            <title>Print Orders - Pending.Sys</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                /* Print Configuration */
                @page { margin: 0; size: A4; }
                
                body { 
                    font-family: 'Cairo', sans-serif; 
                    direction: rtl; 
                    margin: 0; 
                    padding: 0; 
                    color: #000; 
                    -webkit-print-color-adjust: exact; 
                }
                
                /* Page Container: Exact A4 dimensions */
                .page { 
                    padding: 30px 40px; 
                    box-sizing: border-box; 
                    height: 297mm; 
                    width: 210mm;
                    position: relative; 
                    background: #fff;
                    page-break-after: always;
                }
                
                /* Header Styling */
                .header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start; 
                    margin-bottom: 10px; 
                }
                
                .logo-text { 
                    font-family: 'Inter', sans-serif; 
                    font-weight: 900; 
                    font-size: 32px; 
                    line-height: 0.8; 
                    letter-spacing: -1px; 
                }
                
                .logo-sub { 
                    font-family: 'Inter', sans-serif; 
                    font-size: 7px; 
                    letter-spacing: 1px; 
                    text-transform: uppercase; 
                    margin-top: 2px; 
                }
                
                .date { 
                    font-size: 10px; 
                    font-family: 'Inter', sans-serif; 
                    font-weight: 600; 
                }

                /* Document Title */
                .main-title { 
                    text-align: center; 
                    font-weight: 900; 
                    font-size: 20px; 
                    margin: 15px 0 20px 0; 
                    text-decoration: underline;
                    text-underline-offset: 6px;
                }

                /* Customer Information Section */
                .customer-section {
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                }
                
                .info-row {
                    display: flex;
                    align-items: baseline;
                    padding: 3px 0;
                }
                
                .label { 
                    font-size: 11px; 
                    color: #333; 
                    width: 110px;
                    font-weight: 800;
                }
                
                .value { 
                    font-size: 12px; 
                    font-weight: 700; 
                    color: #000;
                    flex: 1;
                }
                
                .vin-value {
                    font-family: 'Inter', monospace;
                    font-size: 15px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    direction: ltr;
                    text-align: right;
                }

                /* Section Headers */
                .section-header {
                    font-size: 12px;
                    font-weight: 900;
                    margin-bottom: 8px;
                    margin-top: 10px;
                    background: #f3f4f6;
                    padding: 4px 10px;
                    border-radius: 4px;
                }

                /* Parts Grid: 3 columns × 6 rows */
                .parts-container { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 10px; 
                    width: 100%;
                }
                
                .parts-col { 
                    display: flex; 
                    flex-direction: column; 
                }
                
                .part-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: baseline;
                    padding: 4px 0;
                    min-height: 22px;
                }
                
                .part-desc { 
                    font-size: 12px;
                    font-weight: 800; 
                    flex: 1;
                    padding-left: 8px;
                }
                
                .part-num { 
                    font-family: 'Inter', monospace; 
                    font-weight: 800; 
                    font-size: 11px;
                    direction: ltr;
                }

                /* Footer Section: Signatures and Approvals */
                .footer { 
                    position: absolute;
                    bottom: 40mm;
                    left: 40px;
                    right: 40px;
                }
                
                .engineer-name {
                    font-weight: 900;
                    font-size: 13px;
                    margin-bottom: 20px;
                    text-align: left;
                }
                
                .note-line {
                    margin-bottom: 15px;
                    font-size: 11px;
                    font-weight: 700;
                }
                
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                    font-weight: 900;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
    `;

	// Generate page content for each VIN
	Object.keys(grouped).forEach((vin) => {
		const rows = grouped[vin];
		const info = rows[0];

		// Distribute parts across 3 columns (6 items per column)
		const rowsPerCol = 6;
		const col1 = rows.slice(0, rowsPerCol);
		const col2 = rows.slice(rowsPerCol, rowsPerCol * 2);
		const col3 = rows.slice(rowsPerCol * 2, rowsPerCol * 3);

		// Helper function to render a single part item
		const renderPart = (p: PendingRow) => {
			const inStock = isPartInStock(p.partStatus);
			// Label icon SVG matching user preference
			const labelIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="black" style="display:inline-block; vertical-align:middle; margin-left:4px;"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>`;
			const indicator = inStock ? labelIcon : "";
			return `
            <div class="part-item">
                <span class="part-desc" style="${inStock ? "font-weight: 900;" : ""}">${indicator}${p.description || "-"}</span>
                <span class="part-num">${p.partNumber || "-"}</span>
            </div>
        `;
		};

		htmlContent += `
            <div class="page">
                <div class="header">
                    <div>
                        <div class="logo-text">EiM</div>
                        <div class="logo-sub">EGYPTIAN INTERNATIONAL MOTORS</div>
                    </div>
                    <div class="date">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
                
                <div class="main-title">نموذج طلب قطع غيار غير متوفرة</div>

                <div class="section-header">بيانات العميل والسيارة</div>
                <div class="customer-section">
                    <div class="info-row"><span class="label">اسم العميل</span><span class="value" style="font-size: 15px; font-weight: 900;">${info.customerName}</span></div>
                    <div class="info-row"><span class="label">رقم أمر الشغل</span><span class="value" style="direction: ltr; text-align: right;">${info.sabNumber || "-"}</span></div>
                    <div class="info-row"><span class="label">موديل السيارة</span><span class="value">${info.model}</span></div>
                    <div class="info-row"><span class="label">رقم الشاسيه</span><span class="value vin-value">${info.vin}</span></div>
                    <div class="info-row"><span class="label">نظام الاصلاح</span><span class="value">${info.repairSystem}</span></div>
                </div>

                <div class="section-header">الأجزاء المطلوبة</div>
                <div class="parts-container">
                    <div class="parts-col">${col1.map(renderPart).join("")}</div>
                    <div class="parts-col">${col2.map(renderPart).join("")}</div>
                    <div class="parts-col">${col3.map(renderPart).join("")}</div>
                </div>

                <div class="footer">
                    <div class="engineer-name">المهندس المسؤول / .............................</div>
                    <div class="section-header">ملاحظات مسؤول قطع الغيار</div>
                    <div class="note-line">1- أسباب عدم التوافر: ............................................................................</div>
                    <div class="note-line">2- الموعد المتوقع للتوافر: .......................................................................</div>
                    <div class="section-header">اعتماد مدير الورشة</div>
                    <div class="note-line">طريقة الطلب ( جوي / بحري / DHL ): ............................................................</div>
                    <div class="signatures">
                        <div>مدير الورشة</div>
                        <div>مسؤول قطع الغيار</div>
                    </div>
                </div>
            </div>
        `;
	});

	htmlContent += `</body></html>`;

	// Inject HTML and trigger print
	printWindow.document.write(htmlContent);
	printWindow.document.close();

	// Auto-trigger print dialog after font loading
	setTimeout(() => {
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	}, 1000);
};
