import type { PendingRow } from "@/types";
import type { AllowedCompany } from "./ordersValidationConstants";
import { getEffectiveNoteHistory } from "./orderWorkflow";

/**
 * Exports selected orders to an XLSX format optimized for logistics.
 * Columns: Name, VIN, Model, Part Number, Description
 */
export const exportToLogisticsXLSX = async (
	selected: PendingRow[],
): Promise<boolean> => {
	if (selected.length === 0) return false;

	const timestamp = new Date().toISOString().split("T")[0];

	const data = selected.map((row) => ({
		"Customer Name": row.customerName,
		VIN: row.vin,
		Model: row.model,
		"Part Number": row.partNumber,
		Description: row.description,
	}));

	await exportToXLSX(data, `Pending_orders_${timestamp}.xlsx`);
	return true;
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
	document.body.removeChild(link);
};

const exportToXLSX = async (
	data: Array<Record<string, unknown>>,
	filename: string,
) => {
	const XLSX = await import("xlsx");
	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
	XLSX.writeFile(workbook, filename);
};

/**
 * Enhanced export that fetches all data and exports to CSV, filtered by company.
 */
export const exportAllSystemDataCSV = (
	allRows: PendingRow[],
	company: AllowedCompany,
): boolean => {
	const timestamp = new Date().toISOString().split("T")[0];

	const filteredRows = allRows.filter((r) => r.company === company);
	if (filteredRows.length === 0) return false;

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

	const allData = filteredRows.map((r) => ({
		...r,
		source: stageMap[r.stage as string] || r.stage || "Unknown",
		reminderText: formatReminder(r.reminder),
		noteHistory: getEffectiveNoteHistory(r),
	}));

	const headers = [
		"source",
		"trackingId",
		"vin",
		"company",
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
		"noteHistory",
		"reminderText",
		"archiveReason",
		"archivedAt",
	];

	const filenamePrefix = company.toLowerCase();
	exportToCSV(
		allData,
		`${filenamePrefix}_system_all_data_${timestamp}`,
		headers,
	);
	return true;
};
