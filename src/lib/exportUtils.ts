import type { AllowedCompany } from "@/domain/order/constants";
import type { OrderStage } from "@/domain/order/orderStage";
import { getEffectiveNoteHistory } from "@/domain/order/orderWorkflow";
import { ORDER_STAGES } from "@/lib/constants";
import type { PendingRow } from "@/types";
import { calculateRemainingTime } from "./utils";

/**
 * Loads every operational stage before a full-system export. The header keeps
 * the resulting rows in React Query, but this loader never treats its cache as
 * a complete representation of the database.
 */
export const fetchAllRowsForExport = async (
	fetchStageRows: (stage: OrderStage) => Promise<PendingRow[]>,
): Promise<PendingRow[]> => {
	const stageRows = await Promise.all(
		ORDER_STAGES.map((stage) => fetchStageRows(stage)),
	);
	return stageRows.flat();
};

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
 * CSV formula-injection sanitizer (issue #252).
 *
 * Audit finding: both CSV writers (`exportToCSV` here and `generateCSV` in
 * `scripts/generate-backup.mjs`) interpolated DB/user-sourced free-text fields
 * with only `"`-escaping and no formula neutralization. Affected fields include
 * customerName, partNumber, description/partDescription, vin, model, mobile,
 * requester/acceptedBy, sabNumber, repairSystem, status/bookingStatus,
 * noteHistory/noteContent/actionNote/bookingNote, reminder subject text
 * (reminderText/reminderSubject), archiveReason, and freezeReason. A value such
 * as `=HYPERLINK(...)` would be executed as a formula by spreadsheet apps on
 * open. The xlsx writers (`exportToXLSX` here, `reportExcel.ts`) build string
 * cells via SheetJS `json_to_sheet` (cell type "s", never "f"), so a leading
 * `=` is stored as literal text and needs no change there.
 *
 * Rule (OWASP CSV injection): after converting to string, if the first
 * character is `=`, `+`, `-`, or `@`, prefix a single quote `'`. Excel/Sheets
 * render the leading `'` as a text marker (not displayed), so legitimate data
 * is preserved and only the formula trigger is neutralized. All other values
 * pass through untouched; callers keep existing `"`-escaping and BOM handling.
 */
export const sanitizeCsvField = (value: unknown): string => {
	const text = value === null || value === undefined ? "" : String(value);
	if (
		text.startsWith("=") ||
		text.startsWith("+") ||
		text.startsWith("-") ||
		text.startsWith("@")
	) {
		return `'${text}`;
	}
	return text;
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
				return `"${sanitizeCsvField(val).replace(/"/g, '""')}"`;
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
		freeze: "FREEZE",
	};

	const formatReminder = (reminder: PendingRow["reminder"]) => {
		if (!reminder) return "";
		return `[${reminder.date} ${reminder.time}] ${reminder.subject}`;
	};

	const allData = filteredRows.map((r) => {
		const rawRow: unknown = r;
		let freezeReason = "";
		let frozenAt = "";

		if (typeof rawRow === "object" && rawRow !== null) {
			const rowMap = rawRow as Record<string, unknown>;
			if (typeof rowMap.freezeReason === "string") {
				freezeReason = rowMap.freezeReason;
			}
			if (typeof rowMap.frozenAt === "string") {
				frozenAt = rowMap.frozenAt;
			}

			if (typeof rowMap.metadata === "object" && rowMap.metadata !== null) {
				const meta = rowMap.metadata as Record<string, unknown>;
				if (!freezeReason && typeof meta.freezeReason === "string") {
					freezeReason = meta.freezeReason;
				}
				if (!frozenAt && typeof meta.frozenAt === "string") {
					frozenAt = meta.frozenAt;
				}
			}
		}

		return {
			...r,
			source: stageMap[r.stage as string] || r.stage || "Unknown",
			remainTime: calculateRemainingTime(r.endWarranty),
			reminderText: formatReminder(r.reminder),
			noteHistory: getEffectiveNoteHistory(r),
			freezeReason,
			frozenAt,
		};
	});

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
		"noteHistory",
		"reminderText",
		"archiveReason",
		"archivedAt",
		"freezeReason",
		"frozenAt",
	];

	const filenamePrefix = company.toLowerCase();
	exportToCSV(
		allData,
		`${filenamePrefix}_system_all_data_${timestamp}`,
		headers,
	);
	return true;
};
