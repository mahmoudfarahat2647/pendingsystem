
import { PendingRow } from './types';

/**
 * PRINT ORDER SYSTEM - TECHNICAL DOCUMENTATION
 * This function handles the generation of a professional A4 spare parts request form.
 * Layout: RTL (Arabic)
 * Pagination: Grouped by VIN
 * Capacity: 18 items per page (3 columns x 6 rows)
 */
export const printOrders = (selected: PendingRow[]) => {
    if (selected.length === 0) {
        alert("Please select orders to print.");
        return;
    }

    // 1. DATA GROUPING LOGIC
    // Group multiple part requests by their VIN to generate separate pages
    const grouped: Record<string, PendingRow[]> = {};
    selected.forEach(row => {
        const key = row.vin || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });

    // 2. WINDOW INITIALIZATION
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 3. CSS & HTML TEMPLATE
    let htmlContent = `
        <html>
        <head>
            <title>Print Orders - Pending.Sys</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { margin: 0; size: A4; }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    direction: rtl; 
                    margin: 0; 
                    padding: 0; 
                    color: #000; 
                    -webkit-print-color-adjust: exact; 
                }
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
                .logo-text { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 32px; line-height: 0.8; letter-spacing: -1px; }
                .logo-sub { font-family: 'Inter', sans-serif; font-size: 7px; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
                .date { font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 600; }

                .main-title { 
                    text-align: center; 
                    font-weight: 900; 
                    font-size: 20px; 
                    margin: 15px 0 20px 0; 
                    text-decoration: underline;
                    text-underline-offset: 6px;
                }

                /* Identity Section */
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

                .section-header {
                    font-size: 12px;
                    font-weight: 900;
                    margin-bottom: 8px;
                    margin-top: 10px;
                    background: #f3f4f6;
                    padding: 4px 10px;
                    border-radius: 4px;
                }

                /* Parts Grid Logic */
                .parts-container { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 10px; 
                    width: 100%;
                }
                .parts-col { display: flex; flex-direction: column; }
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

                /* Signature Footer */
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

    // 4. GENERATE PAGE CONTENT
    Object.keys(grouped).forEach(vin => {
        const rows = grouped[vin];
        const info = rows[0];
        
        // Distribution Logic: 6 items per column
        const rowsPerCol = 6;
        const col1 = rows.slice(0, rowsPerCol);
        const col2 = rows.slice(rowsPerCol, rowsPerCol * 2);
        const col3 = rows.slice(rowsPerCol * 2, rowsPerCol * 3);

        const renderPart = (p: any) => `
            <div class="part-item">
                <span class="part-desc">${p.description || '-'}</span>
                <span class="part-num">${p.partNumber || '-'}</span>
            </div>
        `;

        htmlContent += `
            <div class="page">
                <div class="header">
                    <div>
                        <div class="logo-text">EiM</div>
                        <div class="logo-sub">EGYPTIAN INTERNATIONAL MOTORS</div>
                    </div>
                    <div class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                
                <div class="main-title">نموذج طلب قطع غيار غير متوفرة</div>

                <div class="section-header">بيانات العميل والسيارة</div>
                <div class="customer-section">
                    <div class="info-row"><span class="label">اسم العميل</span><span class="value" style="font-size: 15px; font-weight: 900;">${info.customerName}</span></div>
                    <div class="info-row"><span class="label">رقم أمر الشغل</span><span class="value" style="direction: ltr; text-align: right;">${info.baseId || '-'}</span></div>
                    <div class="info-row"><span class="label">موديل السيارة</span><span class="value">${info.model}</span></div>
                    <div class="info-row"><span class="label">رقم الشاسيه</span><span class="value vin-value">${info.vin}</span></div>
                    <div class="info-row"><span class="label">نظام الاصلاح</span><span class="value">${info.repairSystem}</span></div>
                </div>

                <div class="section-header">الأجزاء المطلوبة</div>
                <div class="parts-container">
                    <div class="parts-col">${col1.map(renderPart).join('')}</div>
                    <div class="parts-col">${col2.map(renderPart).join('')}</div>
                    <div class="parts-col">${col3.map(renderPart).join('')}</div>
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
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // 5. PRINT TRIGGER
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 1000);
};

/**
 * RESERVATION LABEL SYSTEM
 * Generates sticky-size labels for physical parts reservation.
 */
export const printReservationLabels = (selected: PendingRow[]) => {
    if (selected.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = selected.map(row => {
        const today = new Date().toLocaleDateString('en-GB'); 
        return `
            <div class="label-box">
                <div class="header">
                    <div class="header-left">
                        <span class="brand">RENAULT</span>
                    </div>
                    <div class="header-right">قطعة غيار محجوزة</div>
                </div>
                <div class="row name-row">
                    <div class="field-label">اسم العميل</div>
                    <div class="field-value">${row.customerName || '-'}</div>
                </div>
                <div class="row split-row">
                    <div class="cell main-cell"><div class="field-label">اسم القطعه</div><div class="field-value">${row.description || '-'}</div></div>
                    <div class="cell side-cell"><div class="field-label">التاريخ</div><div class="field-value">${today}</div></div>
                </div>
                <div class="row last split-row">
                    <div class="cell main-cell"><div class="field-label">رقم الشاسيه</div><div class="field-value vin-text">${row.vin || '-'}</div></div>
                    <div class="cell side-cell"><div class="field-label">رقم القطعه</div><div class="field-value mono">${row.partNumber || '-'}</div></div>
                </div>
            </div>
        `;
    }).join('');

    printWindow.document.write(`
        <html>
        <head>
            <title>Labels</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 1cm; }
                body { font-family: 'Cairo', sans-serif; direction: rtl; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .label-box { border: 3px solid #000; background: #fff; page-break-inside: avoid; margin-bottom: 10px; display: flex; flex-direction: column; }
                .header { display: flex; border-bottom: 3px solid #000; height: 50px; }
                .header-left { width: 40%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; }
                .header-right { width: 60%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; }
                .row { border-bottom: 2px solid #000; padding: 5px 10px; }
                .split-row { display: flex; padding: 0; }
                .cell { flex: 1; padding: 5px 10px; text-align: center; border-left: 2px solid #000; }
                .cell:last-child { border-left: none; }
                .side-cell { width: 100px; flex-shrink: 0; }
                .field-label { font-size: 10px; font-weight: 700; color: #555; }
                .field-value { font-size: 15px; font-weight: 900; }
                .vin-text { font-family: monospace; font-size: 20px; direction: ltr; }
                .mono { font-family: monospace; font-size: 14px; direction: ltr; }
            </style>
        </head>
        <body><div class="grid">${labelsHtml}</div></body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
};
