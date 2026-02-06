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
 * - **pendingsystem Branding**: Official SVG logo with brand consistency
 * - **RTL Layout**: Right-to-left text flow for Arabic language
 * - **High Contrast**: 4px black borders for warehouse visibility
 * - **Grid System**: 2-column layout optimized for A4 printing
 * - **Date Stamping**: Automatic reservation date in DD/MM/YYYY format
 *
 * ## Label Layout
 * Each label contains:
 * - Header: pendingsystem logo + "Reserved Part" status
 * - Customer name (large, emphasized)
 * - Part description and reservation date
 * - VIN (monospace for clarity) and part number
 *
 * @author pendingsystem Development Team
 * @since 2025-12-25
 */

const PENDINGSYSTEM_LOGO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136.45 178.6" class="logo">
        <title>pendingsystem logo</title>
        <polygon points="47.76 0 0 89.3 47.76 178.6 61.4 178.6 109.17 89.3 78.46 31.89 71.64 44.65 95.52 89.3 54.58 165.84 13.65 89.3 61.4 0 47.76 0"/>
        <polygon points="75.05 0 27.29 89.3 57.99 146.71 64.81 133.95 40.93 89.3 81.87 12.76 122.81 89.3 75.05 178.6 88.69 178.6 136.45 89.3 88.69 0 75.05 0"/>
    </svg>
`;

const ZEEKR_LOGO_SVG = `
    <svg width="115" height="29" viewBox="0 0 115 29" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo">
        <path d="M26.0757 25.7588H19.0554V17.0847L12.035 10.0663V2.33946H26.0675L26.0757 25.7588ZM2.67723 25.7588V2.33946H9.68937V11.0301L16.7097 18.0485V25.7506L2.67723 25.7588ZM28.4131 0H0.339844V28.0982H28.4131V0Z" fill="black"/>
        <path d="M50.3248 9.49053L43.0493 17.0855H49.9462V18.6342H39.2305V18.6013L46.506 11.0145H39.6338V9.46582H50.333V9.49053H50.3248Z" fill="black"/>
        <path d="M95.8193 18.6424L89.0952 13.9059V18.6424H87.2188V9.46582H89.0952V13.8811L95.63 9.46582H98.5188L91.9511 13.8482L98.7411 18.6342H95.8193V18.6424Z" fill="black"/>
        <path d="M114.741 18.6424L109.647 15.2156H110.593C112.387 15.2156 113.959 14.1859 113.959 12.4396V12.316C113.959 10.5367 112.371 9.46582 110.527 9.46582H103.062V18.6342H104.939V13.8482L111.976 18.6342H114.741V18.6424ZM104.931 11.0227H110.56C111.26 11.0227 111.91 11.3028 112.091 11.8712C112.099 11.97 112.124 12.2089 112.124 12.4478C112.124 12.6949 112.108 12.9338 112.091 13.0244C111.902 13.5269 111.26 13.8317 110.56 13.8317H104.931V11.0227Z" fill="black"/>
        <path d="M65.5477 17.0114V18.6424H56.0254V9.46582H65.5477V11.0969H57.8443V13.0656H65.1445V14.6967H57.8443V17.0032H65.5477V17.0114Z" fill="black"/>
        <path d="M81.1454 17.0114V18.6424H71.623V9.46582H81.1454V11.0969H73.4419V13.0656H80.7421V14.6967H73.4419V17.0032H81.1454V17.0114Z" fill="black"/>
    </svg>
`;

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
			const isZeekr = row.company?.toLowerCase() === "zeekr";
			const logoSvg = isZeekr ? ZEEKR_LOGO_SVG : PENDINGSYSTEM_LOGO_SVG;
			const brandName = isZeekr ? "" : "PENDINGSYSTEM";

			return `
            <div class="label-box">
                <!-- Header: Brand on Left, Status Title on Right -->
                <div class="header">
                    <div class="header-left">
                        ${logoSvg}
                        <span class="brand">${brandName}</span>
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
