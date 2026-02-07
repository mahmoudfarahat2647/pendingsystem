import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import { useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import type { PartStatusDef, PendingRow } from "@/types";
import {
	ActionCellRenderer,
	PartStatusRenderer,
	StatusRenderer,
	VinCellRenderer,
	WarrantyRenderer,
} from "../renderers";

type GridType = "main" | "orders" | "booking" | "archive" | "call";

interface UseColumnDefsOptions {
	onNoteClick?: (row: PendingRow) => void;
	onReminderClick?: (row: PendingRow) => void;
	onAttachClick?: (row: PendingRow) => void;
	partStatuses?: PartStatusDef[];
}

export function useColumnDefs(
	type: GridType,
	options: UseColumnDefsOptions = {},
): ColDef[] {
	const {
		onNoteClick,
		onReminderClick,
		onAttachClick,
		partStatuses = [],
	} = options;
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);

	// Common column definitions
	const baseColumns: ColDef[] = [
		{
			headerName: "",
			colId: "selection",
			field: "id",
			checkboxSelection: true,
			headerCheckboxSelection: true,
			headerCheckboxSelectionFilteredOnly: true,
			width: 50,
			maxWidth: 50,
			sortable: false,
			filter: false,
			resizable: false,
			pinned: "left",
			suppressHeaderMenuButton: true,
			valueFormatter: () => "",
			cellClass: "flex items-center justify-center",
		},
		{
			headerName: "ACTIONS",
			colId: "actions",
			field: "id",
			checkboxSelection: false,
			headerCheckboxSelection: false,
			cellRenderer: ActionCellRenderer,
			cellRendererParams: {
				onNoteClick,
				onReminderClick,
				onAttachClick,
			},
			width: 100,
			maxWidth: 100,
			sortable: false,
			filter: false,
			suppressHeaderMenuButton: true,
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
			valueFormatter: (params: ValueFormatterParams) =>
				params.value || "pendingsystem",
		},
		{
			headerName: "CUSTOMER NAME",
			field: "customerName",
			filter: "agTextColumnFilter",
			minWidth: 140,
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
			headerName: "REPAIR SYSTEM",
			field: "repairSystem",
			width: 100,
		},
		{
			headerName: "WARRANTY",
			field: "remainTime",
			cellRenderer: WarrantyRenderer,
			width: 100,
		},
	];

	return useMemo(() => {
		switch (type) {
			case "main":
				return [
					...baseColumns,
					{
						headerName: "PART STATUS",
						field: "partStatus",
						width: 70,
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
				];

			case "orders":
				return [
					...baseColumns,
					{
						headerName: "REQUESTER",
						field: "requester",
						width: 120,
					},
				];

			case "booking":
				return [
					...baseColumns,
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
							partStatuses: bookingStatuses,
						},
						cellClass: "flex items-center justify-center",
					},
				];

			default:
				return baseColumns;
		}
	}, [type, partStatuses, bookingStatuses, baseColumns]); // Added dependencies to ensure updates when callbacks change
}
