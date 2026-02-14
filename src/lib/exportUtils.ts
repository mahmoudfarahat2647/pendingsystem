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
const exportToCSV = (
	data: Array<Record<string, unknown>>,
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
	link.remove();
};

/**
 * Exports all system data to a consolidated CSV workbook.
 */
export const exportWorkbookCSV = (stores: {
	orders: PendingRow[];
	mainSheet: PendingRow[];
	booking: PendingRow[];
	callList: PendingRow[];
	archive: PendingRow[];
}) => {
	const timestamp = new Date().toISOString().split("T")[0];

	// Create helper to format reminder
	const formatReminder = (reminder: PendingRow["reminder"]) => {
		if (!reminder) return "";
		return `[${reminder.date} ${reminder.time}] ${reminder.subject}`;
	};

	// Add "Source" column and format complex fields
	const allData = [
		...stores.orders.map((r) => ({
			...r,
			source: "Orders",
			reminderText: formatReminder(r.reminder),
		})),
		...stores.mainSheet.map((r) => ({
			...r,
			source: "Main Sheet",
			reminderText: formatReminder(r.reminder),
		})),
		...stores.booking.map((r) => ({
			...r,
			source: "Booking",
			reminderText: formatReminder(r.reminder),
		})),
		...stores.callList.map((r) => ({
			...r,
			source: "Call List",
			reminderText: formatReminder(r.reminder),
		})),
		...stores.archive.map((r) => ({
			...r,
			source: "Archive",
			reminderText: formatReminder(r.reminder),
		})),
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
		"cntrRdg",
		"partNumber",
		"description",
		"status",
		"rDate",
		"requester",
		"acceptedBy",
		"sabNumber",
		"repairSystem",
		"startWarranty",
		"endWarranty",
		"remainTime",
		"bookingDate",
		"bookingStatus",
		"partStatus",
		"noteContent",
		"actionNote",
		"bookingNote",
		"reminderText",
		"archiveReason",
		"archivedAt",
	];

	exportToCSV(allData, `renault_system_workbook_${timestamp}`, headers);
};

/**
 * Enhanced export that fetches all data and exports to CSV.
 */
export const exportAllSystemDataCSV = (allRows: PendingRow[]) => {
	const timestamp = new Date().toISOString().split("T")[0];

	const stageMap: Record<string, string> = {
		orders: "Orders",
		main: "Main Sheet",
		booking: "Booking",
		call: "Call List",
		archive: "Archive",
	};

	const formatReminder = (reminder: PendingRow["reminder"]) => {
		if (!reminder) return "";
		return `[${reminder.date} ${reminder.time}] ${reminder.subject}`;
	};

	const allData = allRows.map((r) => ({
		...r,
		source: stageMap[r.stage as string] || r.stage || "Unknown",
		reminderText: formatReminder(r.reminder),
	}));

	const headers = [
		"source",
		"trackingId",
		"vin",
		"customerName",
		"mobile",
		"model",
		"cntrRdg",
		"partNumber",
		"description",
		"status",
		"rDate",
		"requester",
		"acceptedBy",
		"sabNumber",
		"repairSystem",
		"startWarranty",
		"endWarranty",
		"remainTime",
		"bookingDate",
		"bookingStatus",
		"partStatus",
		"noteContent",
		"actionNote",
		"bookingNote",
		"reminderText",
		"archiveReason",
		"archivedAt",
	];

	exportToCSV(allData, `renault_system_all_data_${timestamp}`, headers);
};
