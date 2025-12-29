import type { PendingRow } from "@/types";

/**
 * @module ReservationLabelPrinter
 * @description Professional reservation label generator for physical part tagging in automotive workshops
 *
 * ## Purpose
 * Generates high-quality A4 printable labels (2 per row) for reserved spare parts.
 * Labels are designed to be affixed to physical inventory items in the warehouse.
 *
 * ## Features
 * - **Renault Branding**: Official SVG logo with brand consistency
 * - **RTL Layout**: Right-to-left text flow for Arabic language
 * - **High Contrast**: 4px black borders for warehouse visibility
 * - **Grid System**: 2-column layout optimized for A4 printing
 * - **Date Stamping**: Automatic reservation date in DD/MM/YYYY format
 *
 * ## Label Layout
 * Each label contains:
 * - Header: Renault logo + "Reserved Part" status
 * - Customer name (large, emphasized)
 * - Part description and reservation date
 * - VIN (monospace for clarity) and part number
 *
 * @author Renault System Development Team
 * @since 2025-12-25
 */

/**
 * Prints reservation labels for selected parts
 *
 * @param {PendingRow[]} selected - Array of selected pending rows to print labels for
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Print labels for selected orders
 * const selectedOrders = [...];
 * printReservationLabels(selectedOrders);
 * ```
 */
export const printReservationLabels = (selected: PendingRow[]): void => {
	// Validation: Ensure at least one order is selected
	if (selected.length === 0) {
		alert("Please select items to print reservation labels.");
		return;
	}

	// Open new window for print-isolated context (prevents CSS bleeding)
	const printWindow = window.open("", "_blank");
	if (!printWindow) return;

	// Generate HTML for each label
	const labelsHtml = selected
		.map((row) => {
			const today = new Date().toLocaleDateString("en-GB"); // Format: DD/MM/YYYY
			return `
            <div class="label-box">
                <!-- Header: Brand on Left, Status Title on Right -->
                <div class="header">
                    <div class="header-left">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136.45 178.6" class="logo">
                            <title>Renault logo</title>
                            <polygon points="47.76 0 0 89.3 47.76 178.6 61.4 178.6 109.17 89.3 78.46 31.89 71.64 44.65 95.52 89.3 54.58 165.84 13.65 89.3 61.4 0 47.76 0"/>
                            <polygon points="75.05 0 27.29 89.3 57.99 146.71 64.81 133.95 40.93 89.3 81.87 12.76 122.81 89.3 75.05 178.6 88.69 178.6 136.45 89.3 88.69 0 75.05 0"/>
                        </svg>
                        <span class="brand">RENAULT</span>
                    </div>
                    <div class="header-right">قطعة غيار محجوزة</div>
                </div>
                
                <!-- Row 1: Customer Full Name -->
                <div class="row name-row">
                    <div class="field-label">اسم العميل (Customer Name)</div>
                    <div class="field-value large-text">${row.customerName || "-"}</div>
                </div>

                <!-- Row 2: Part Description & Date -->
                <div class="row split-row">
                    <div class="cell main-cell">
                        <div class="field-label">اسم القطعة (Part Description)</div>
                        <div class="field-value">${row.description || "-"}</div>
                    </div>
                    <div class="cell side-cell date-cell">
                        <div class="field-label">تاريخ الحجز (Date)</div>
                        <div class="field-value">${today}</div>
                    </div>
                </div>

                <!-- Row 3: VIN & Part Number -->
                <div class="row split-row last">
                    <div class="cell main-cell">
                        <div class="field-label">رقم الشاسيه (VIN)</div>
                        <div class="field-value vin-text">${row.vin || "-"}</div>
                    </div>
                    <div class="cell side-cell part-no-cell">
                        <div class="field-label">رقم القطعة (Part No)</div>
                        <div class="field-value mono-text">${row.partNumber || "-"}</div>
                    </div>
                </div>
            </div>
        `;
		})
		.join("");

	// Complete HTML document with embedded styles
	const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Reservation Labels</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                /* Print Configuration */
                @page { margin: 1cm; size: A4; }
                
                body { 
                    font-family: 'Cairo', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                    -webkit-print-color-adjust: exact;
                }
                
                /* Grid Layout: 2 labels per row */
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                /* Label Container */
                .label-box {
                    border: 4px solid black;
                    background: #fdfbf7;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                /* Header Section */
                .header {
                    display: flex;
                    border-bottom: 4px solid black;
                    height: 70px;
                    flex-shrink: 0;
                }
                
                .header-left {
                    width: 45%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    gap: 8px;
                }
                
                .logo {
                    height: 40px;
                    width: auto;
                    fill: black;
                }
                
                .brand {
                    font-family: sans-serif;
                    font-weight: 900;
                    font-size: 18px;
                    letter-spacing: 1px;
                }
                
                .header-right {
                    width: 55%;
                    background: black;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 900;
                }
                
                /* Content Rows */
                .row {
                    border-bottom: 2px solid black;
                    padding: 10px;
                }
                
                .row.last { border-bottom: none; flex: 1; }
                .name-row { text-align: center; background: rgba(0,0,0,0.02); }
                .split-row { display: flex; padding: 0; align-items: stretch; }
                
                /* Cell Structure */
                .cell {
                    padding: 10px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .main-cell { flex: 1; }
                .date-cell { width: 130px !important; flex-shrink: 0; }
                .part-no-cell { width: 220px !important; flex-shrink: 0; text-align: right !important; padding-right: 20px !important; }
                .part-no-cell .field-label { text-align: right !important; padding-left: 0; }
                .cell:first-child { border-left: 2px solid black; }
                
                /* Typography */
                .field-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #555;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                
                .field-value {
                    font-size: 18px;
                    font-weight: 900;
                    line-height: 1.1;
                    color: black;
                }
                
                .large-text { font-size: 22px; }
                
                .vin-text {
                    font-family: 'Courier New', monospace;
                    font-weight: 900;
                    font-size: 15px;
                    direction: ltr;
                    letter-spacing: 0.5px;
                }
                
                .mono-text {
                    font-family: 'Courier New', monospace;
                    font-weight: 900;
                    direction: ltr;
                    font-size: 18px;
                }
            </style>
        </head>
        <body>
            <div class="grid-container">
                ${labelsHtml}
            </div>
            <script>
                // Auto-trigger print dialog after fonts load
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;

	// Inject HTML and trigger print
	printWindow.document.write(htmlContent);
	printWindow.document.close();
};
