import type { PendingRow } from "@/types";

/**
 * Exports selected orders to a CSV format optimized for logistics.
 * Columns: Name, VIN, Model, Part Number, Description
 */
export const exportToLogisticsCSV = (selected: PendingRow[]) => {
	if (selected.length === 0) return;

	const headers = [
		"Customer Name",
		"VIN",
		"Model",
		"Part Number",
		"Description",
	];
	const timestamp = new Date().toISOString().split("T")[0];

	const data = selected.map((row) => ({
		"Customer Name": row.customerName,
		VIN: row.vin,
		Model: row.model,
		"Part Number": row.partNumber,
		Description: row.description,
	}));

	exportToCSV(data, `logistics_export_${timestamp}`, headers);
};

/**
 * Exports data to a CSV file.
 */
export const exportToCSV = (
	data: any[],
	filename: string,
	headers?: string[],
) => {
	if (data.length === 0) return;

	const columnHeaders = headers || Object.keys(data[0]);

	const rows = data.map((item) =>
		columnHeaders
			.map((header) => {
				const val = item[header] || "";
				return `"${String(val).replace(/"/g, '""')}"`;
			})
			.join(","),
	);

	const csvContent = `\uFEFF${[columnHeaders.join(","), ...rows].join("\n")}`;

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);

	link.setAttribute("href", url);
	link.setAttribute("download", `${filename}.csv`);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

/**
 * Exports all system data to a consolidated CSV workbook.
 */
export const exportWorkbookCSV = (stores: {
	orders: any[];
	mainSheet: any[];
	booking: any[];
	callList: any[];
	archive: any[];
}) => {
	const timestamp = new Date().toISOString().split("T")[0];

	// Add "Source" column to identify where data came from
	const allData = [
		...stores.orders.map((r) => ({ ...r, source: "Orders" })),
		...stores.mainSheet.map((r) => ({ ...r, source: "Main Sheet" })),
		...stores.booking.map((r) => ({ ...r, source: "Booking" })),
		...stores.callList.map((r) => ({ ...r, source: "Call List" })),
		...stores.archive.map((r) => ({ ...r, source: "Archive" })),
	];

	if (allData.length === 0) return;

	// Common columns for all sheets
	const headers = [
		"source",
		"trackingId",
		"vin",
		"customerName",
		"mobile",
		"model",
		"partNumber",
		"description",
		"status",
		"rDate",
		"requester",
		"bookingDate",
		"bookingStatus",
		"partStatus",
	];

	exportToCSV(allData, `renault_system_workbook_${timestamp}`, headers);
};
