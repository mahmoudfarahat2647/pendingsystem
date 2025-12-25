
import { PendingRow } from './types';

/**
 * Prints professional A4 part reservation labels.
 * Layout: 2 labels per row (Grid), designed for physical part tagging.
 * Features: Renault branding, high-contrast black borders, RTL support.
 */
export const printReservationLabels = (selected: PendingRow[]) => {
    if (selected.length === 0) {
        alert("Please select items to print reservation labels.");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = selected.map(row => {
        const today = new Date().toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
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
                    <div class="field-value large-text">${row.customerName || '-'}</div>
                </div>

                <!-- Row 2: Part Description & Date -->
                <div class="row split-row">
                    <div class="cell main-cell">
                        <div class="field-label">اسم القطعة (Part Description)</div>
                        <div class="field-value">${row.description || '-'}</div>
                    </div>
                    <div class="cell side-cell">
                        <div class="field-label">تاريخ الحجز (Date)</div>
                        <div class="field-value">${today}</div>
                    </div>
                </div>

                <!-- Row 3: VIN & Part Number -->
                <div class="row split-row last">
                    <div class="cell main-cell">
                        <div class="field-label">رقم الشاسيه (VIN)</div>
                        <div class="field-value vin-text">${row.vin || '-'}</div>
                    </div>
                    <div class="cell side-cell">
                        <div class="field-label">رقم القطعة (Part No)</div>
                        <div class="field-value mono-text">${row.partNumber || '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Reservation Labels</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { margin: 1cm; size: A4; }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                    -webkit-print-color-adjust: exact;
                }
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .label-box {
                    border: 4px solid black;
                    background: #fdfbf7;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
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
                .row {
                    border-bottom: 2px solid black;
                    padding: 10px;
                }
                .row.last { border-bottom: none; flex: 1; }
                .name-row { text-align: center; background: rgba(0,0,0,0.02); }
                .split-row { display: flex; padding: 0; align-items: stretch; }
                .cell {
                    padding: 10px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .main-cell { flex: 1; }
                .side-cell { width: 130px; flex-shrink: 0; }
                
                /* Border between cells */
                .cell:first-child { border-left: 2px solid black; }
                
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
                    font-size: 24px;
                    direction: ltr;
                    letter-spacing: 1px;
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
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

/**
 * Prints the official Spare Parts Order Form.
 * Optimized for A4, single page per VIN.
 * Replication Note: This is the exact layout of the formal order page.
 */
export const printOrders = (selected: PendingRow[]) => {
    if (selected.length === 0) {
        alert("Please select orders to print.");
        return;
    }

    const grouped: Record<string, PendingRow[]> = {};
    selected.forEach(row => {
        const key = row.vin || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Spare Parts Request</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { margin: 0; size: A4; }
                body { font-family: 'Cairo', sans-serif; direction: rtl; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; }
                .page { padding: 40px; box-sizing: border-box; height: 100vh; position: relative; background: #fff; page-break-after: always; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 3px solid black; padding-bottom: 15px; }
                .logo-text { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 44px; line-height: 1; letter-spacing: -2px; }
                .logo-sub { font-family: 'Inter', sans-serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; }
                .main-title { text-align: center; font-weight: 900; font-size: 24px; margin: 30px 0; border-bottom: 2px solid #000; display: inline-block; width: 100%; padding-bottom: 10px; }
                .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                .info-item { display: flex; border-bottom: 1px solid #ddd; padding: 10px 0; }
                .label { font-size: 13px; font-weight: 800; width: 140px; color: #333; }
                .value { font-size: 15px; font-weight: 900; flex: 1; color: black; }
                .vin-val { font-family: 'Inter', monospace; direction: ltr; text-align: right; letter-spacing: 1px; font-size: 18px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .table th { background: #000; color: #fff; padding: 12px; font-size: 14px; text-align: right; }
                .table td { border: 1px solid #000; padding: 12px; font-size: 15px; font-weight: 900; }
                .table tr:nth-child(even) { background: #f9f9f9; }
                .footer { position: absolute; bottom: 80px; left: 40px; right: 40px; }
                .sig-box { display: flex; justify-content: space-between; margin-top: 80px; font-weight: 900; font-size: 14px; }
                .sig-item { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 10px; }
            </style>
        </head>
        <body>
    `;

    Object.keys(grouped).forEach(vin => {
        const rows = grouped[vin];
        const info = rows[0];
        
        htmlContent += `
            <div class="page">
                <div class="header">
                    <div><div class="logo-text">EiM</div><div class="logo-sub">EGYPTIAN INTERNATIONAL MOTORS</div></div>
                    <div style="text-align: left;"><div style="font-size: 14px; font-weight: 900;">RENAULT EGYPT</div><div style="font-size: 12px; font-weight: 700;">${new Date().toLocaleDateString('en-GB')}</div></div>
                </div>
                <div class="main-title">نموذج طلب توريد قطع غيار مستعجل (V.O.R)</div>
                <div class="info-section">
                    <div class="info-item"><span class="label">اسم العميل :</span><span class="value">${info.customerName}</span></div>
                    <div class="info-item"><span class="label">رقم الشاسيه :</span><span class="value vin-val">${info.vin}</span></div>
                    <div class="info-item"><span class="label">موديل السيارة :</span><span class="value">${info.model}</span></div>
                    <div class="info-item"><span class="label">رقم أمر الشغل :</span><span class="value" style="direction: ltr; text-align: right;">${info.baseId}</span></div>
                    <div class="info-item"><span class="label">نظام الإصلاح :</span><span class="value">${info.repairSystem}</span></div>
                    <div class="info-item"><span class="label">التاريخ :</span><span class="value">${info.rDate}</span></div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 60px; text-align: center;">م</th>
                            <th style="width: 200px;">رقم القطعة (Part Number)</th>
                            <th>الوصف (Description)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, i) => `
                            <tr>
                                <td style="text-align: center;">${i + 1}</td>
                                <td style="font-family: 'Inter', monospace; font-size: 16px;">${r.partNumber}</td>
                                <td>${r.description}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    <div style="font-weight: 900; margin-bottom: 25px; border-bottom: 1px dashed #999; padding-bottom: 10px;">ملاحظات : ...........................................................................................................................................</div>
                    <div class="sig-box">
                        <div class="sig-item">توقيع مدير الورشة</div>
                        <div class="sig-item">توقيع مهندس الاستقبال</div>
                        <div class="sig-item">توقيع مسؤول المخزن</div>
                    </div>
                </div>
            </div>
        `;
    });

    htmlContent += `</body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
};
