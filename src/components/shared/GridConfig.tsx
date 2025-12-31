"use client";

import type {
	ColDef,
	ICellRendererParams,
	ValueFormatterParams,
} from "ag-grid-community";
import { Bell, Paperclip, StickyNote } from "lucide-react";
import { cn, getVinColor } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartStatusDef, PendingRow } from "@/types";

// VIN Cell Renderer - applies unique branded 'tonal' style based on VIN
export const VinCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const vin = params.value as string;
	if (!vin) return null;

	const style = getVinColor(vin);

	return (
		<div className="flex items-center justify-start h-full">
			<span
				className="px-2 py-0 rounded-full text-[11px] font-bold tracking-normal shadow-sm border border-transparent"
				style={{
					backgroundColor: style.bg,
					color: style.text,
					borderColor: style.border,
				}}
			>
				{vin}
			</span>
		</div>
	);
};

// Action Cell Renderer - shows icons for attachment, note, history
export const ActionCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;

	const isLocked = params.colDef?.cellRendererParams?.isLocked;

	return (
		<div
			className={cn(
				"flex items-center gap-3 h-full px-2",
				isLocked && "pointer-events-none",
			)}
		>
			<button
				type="button"
				className={`transition-colors ${data.hasAttachment ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
				title="Attachment"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onAttachClick) {
						params.colDef.cellRendererParams.onAttachClick(data);
					}
				}}
			>
				<Paperclip className="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				className={`transition-colors ${data.actionNote ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
				title="Note"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onNoteClick) {
						params.colDef.cellRendererParams.onNoteClick(data);
					}
				}}
			>
				<StickyNote className="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				className={`transition-colors ${data.reminder ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
				title="Reminder"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onReminderClick) {
						params.colDef.cellRendererParams.onReminderClick(data);
					}
				}}
			>
				<Bell className="h-3.5 w-3.5" />
			</button>
		</div>
	);
};

// Part Status Renderer - shows colored bullet based on status
interface PartStatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const PartStatusRenderer = (params: PartStatusRendererProps) => {
	const value = params.value as string;

	// Enhanced null safety: handle undefined, null, or empty partStatuses array
	const statuses = params.partStatuses || [];

	// Handle empty state or explicit "No Stats" selection
	if (
		!value ||
		(typeof value === "string" && (value.trim() === "" || value === "No Stats"))
	) {
		const noStatsDef = statuses.find((s) => s.id === "no_stats");
		return (
			<div
				className="flex items-center justify-center h-full w-full gap-1"
				title="Select status"
			>
				<span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
					{noStatsDef?.label || "No Stats"}
				</span>
			</div>
		);
	}

	// Handle selected state - status is selected
	// Enhanced error handling for missing or invalid status definitions
	let statusDef: PartStatusDef | undefined;
	let colorClass = "bg-gray-400"; // Default fallback color
	let style: React.CSSProperties | undefined;
	let displayValue = value;

	try {
		// Safely find the status definition
		if (Array.isArray(statuses) && statuses.length > 0) {
			statusDef = statuses.find((s: PartStatusDef) => {
				// Additional null safety for individual status objects
				return s && typeof s.label === "string" && s.label === value;
			});
		}

		// Apply color with fallback handling
		if (statusDef?.color && typeof statusDef.color === "string") {
			const trimmedColor = statusDef.color.trim();
			if (trimmedColor.length > 0) {
				// Check if it's a hex color or rgb color
				if (trimmedColor.startsWith("#") || trimmedColor.startsWith("rgb")) {
					colorClass = "";
					style = { backgroundColor: trimmedColor };
				} else {
					colorClass = trimmedColor;
				}
			}
		}

		// Ensure display value is safe
		if (typeof value !== "string") {
			displayValue = String(value || "");
		}
	} catch (_error) {
		colorClass = "bg-gray-400";
		displayValue = String(value || "Unknown");
	}

	return (
		<div
			className="flex items-center justify-center h-full w-full gap-1.5 px-1"
			title={displayValue}
		>
			<div
				className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-sm ring-1 ring-black/10 flex-shrink-0`}
				style={style}
			></div>
		</div>
	);
};

// Warranty Info Renderer - shows remaining time with color coding
export const WarrantyRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;

	const isExpired = data.remainTime === "Expired" || data.remainTime === "";

	return (
		<div
			className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-300"}`}
			title={`Start: ${data.startWarranty}\nEnd: ${data.endWarranty}`}
		>
			{data.remainTime || "N/A"}
		</div>
	);
};

// Status Badge Renderer - Minimalist text
export const StatusRenderer = (params: ICellRendererParams<PendingRow>) => {
	const value = params.value as string;
	// Just simple text for the flat look, or minimal coloring if preferred
	return (
		<span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
			{value}
		</span>
	);
};

// Common column definitions
export const getBaseColumns = (
	onNoteClick?: (row: PendingRow) => void,
	onReminderClick?: (row: PendingRow) => void,
	onAttachClick?: (row: PendingRow) => void,
	isLocked?: boolean,
): ColDef<PendingRow>[] => [
		{
			headerName: "",
			field: "id",
			checkboxSelection: true,
			headerCheckboxSelection: true,
			width: 50,
			maxWidth: 50,
			sortable: false,
			filter: false,
			resizable: false,
			pinned: "left",
			suppressMenu: true,
			valueFormatter: () => "", // Hide the ID number
			cellClass: "flex items-center justify-center",
		},
		{
			headerName: "ACTIONS",
			field: "id",
			cellRenderer: ActionCellRenderer,
			cellRendererParams: {
				onNoteClick,
				onReminderClick,
				onAttachClick,
				isLocked,
			},
			width: 100,
			maxWidth: 100,
			sortable: false,
			filter: false,
			suppressMenu: true,
		},
		{
			headerName: "STATS",
			field: "status",
			cellRenderer: StatusRenderer,
			width: 80,
		},
		{
			headerName: "R/DATE",
			field: "rDate",
			width: 100,
		},
		{
			headerName: "COMPANY",
			field: "company",
			width: 90,
			cellClass: "font-bold text-center",
			valueFormatter: (params: ValueFormatterParams<PendingRow>) =>
				params.value || "Renault",
		},
		{
			headerName: "CUSTOMER NAME",
			field: "customerName",
			filter: "agTextColumnFilter",
			minWidth: 180,
			cellClass: "font-medium truncate",
		},
		{
			headerName: "VIN NO/",
			field: "vin",
			cellRenderer: VinCellRenderer,
			filter: "agTextColumnFilter",
			minWidth: 170,
		},
		{
			headerName: "MOBILE",
			field: "mobile",
			width: 110,
		},
		{
			headerName: "CNTR RDG",
			field: "cntrRdg",
			width: 90,
		},
		{
			headerName: "SAB NO.",
			field: "sabNumber",
			width: 110,
		},
		{
			headerName: "ACCEPTED BY",
			field: "acceptedBy",
			width: 120,
		},
		{
			headerName: "MODEL",
			field: "model",
			width: 100,
		},
		{
			headerName: "PART NUMBER",
			field: "partNumber",
			filter: "agTextColumnFilter",
			minWidth: 120,
		},
		{
			headerName: "DESCRIPTION",
			field: "description",
			filter: "agTextColumnFilter",
			minWidth: 180,
		},
		{
			headerName: "نظام اصلاح",
			field: "repairSystem",
			width: 100,
		},
		{
			headerName: "مدة ضمان",
			field: "remainTime",
			cellRenderer: WarrantyRenderer,
			width: 100,
		},
	];

export const getOrdersColumns = (
	partStatuses: PartStatusDef[] = [],
	onNoteClick?: (row: PendingRow) => void,
	onReminderClick?: (row: PendingRow) => void,
	onAttachClick?: (row: PendingRow) => void,
): ColDef<PendingRow>[] => [
		...getBaseColumns(onNoteClick, onReminderClick, onAttachClick),
		{
			headerName: "PART STATUS",
			field: "partStatus",
			width: 100,
			minWidth: 100,
			editable: true,
			cellRenderer: PartStatusRenderer,
			cellRendererParams: {
				partStatuses: Array.isArray(partStatuses) ? partStatuses : [],
			},
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values:
					Array.isArray(partStatuses) && partStatuses.length > 0
						? partStatuses
							.filter((s) => s && typeof s.label === "string")
							.map((s) => s.label)
						: [],
			},
			cellClass: "flex items-center justify-center",
		},
		{
			headerName: "REQUESTER",
			field: "requester",
			width: 120,
		},
	];

export const getMainSheetColumns = (
	partStatuses: PartStatusDef[] = [],
	onNoteClick?: (row: PendingRow) => void,
	onReminderClick?: (row: PendingRow) => void,
	onAttachClick?: (row: PendingRow) => void,
	isLocked?: boolean,
): ColDef<PendingRow>[] => [
		...getBaseColumns(onNoteClick, onReminderClick, onAttachClick, isLocked),
		{
			headerName: "PART STATUS",
			field: "partStatus",
			width: 70,
			editable: !isLocked,
			cellRenderer: PartStatusRenderer,
			cellRendererParams: {
				partStatuses: Array.isArray(partStatuses) ? partStatuses : [],
			},
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values:
					Array.isArray(partStatuses) && partStatuses.length > 0
						? partStatuses
							.filter((s) => s && typeof s.label === "string")
							.map((s) => s.label)
						: [],
			},
			cellClass: "flex items-center justify-center",
		},
	];

export const getBookingColumns = (
	onNoteClick?: (row: PendingRow) => void,
	onReminderClick?: (row: PendingRow) => void,
	onAttachClick?: (row: PendingRow) => void,
): ColDef<PendingRow>[] => [
		...getBaseColumns(onNoteClick, onReminderClick, onAttachClick),
		{
			headerName: "BOOKING DATE",
			field: "bookingDate",
			width: 130,
			cellStyle: { color: "#22c55e", fontWeight: 500 },
		},
		{
			headerName: "STATUS",
			field: "bookingStatus",
			width: 70,
			cellRenderer: PartStatusRenderer,
			cellRendererParams: {
				partStatuses: useAppStore.getState().bookingStatuses,
			},
			cellClass: "flex items-center justify-center",
		},
	];
