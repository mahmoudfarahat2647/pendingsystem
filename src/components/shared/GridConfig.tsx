"use client";

import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import { useAppStore } from "@/store/useStore";
import type { PartStatusDef, PendingRow } from "@/types";

import { ActionCellRenderer } from "../grid/renderers/ActionCellRenderer";
import { PartStatusRenderer } from "../grid/renderers/PartStatusRenderer";
import { StatusRenderer } from "../grid/renderers/StatusRenderer";
import { VinCellRenderer } from "../grid/renderers/VinCellRenderer";
import { WarrantyRenderer } from "../grid/renderers/WarrantyRenderer";

// Common column definitions
export const getBaseColumns = (
	onNoteClick?: (row: PendingRow) => void,
	onReminderClick?: (row: PendingRow) => void,
	onAttachClick?: (row: PendingRow) => void,
	isLocked?: boolean,
): ColDef<PendingRow>[] => [
		{
			headerName: "",
			colId: "selection",
			field: "id",
			checkboxSelection: true,
			headerCheckboxSelection: true,
			width: 50,
			maxWidth: 50,
			sortable: false,
			filter: false,
			resizable: false,
			pinned: "left",
			suppressHeaderMenuButton: true,
			valueFormatter: () => "", // Hide the ID number
			cellClass: "flex items-center justify-center",
		},
		{
			headerName: "ACTIONS",
			colId: "actions",
			// field: "id", // REMOVED: Using ID suppresses updates if ID doesn't change
			// Use valueGetter to force re-render when relevant data changes
			valueGetter: (params) => {
				const data = params.data;
				if (!data) return "";
				// [CRITICAL] COMPOSITE KEY FOR REACTIVITY
				// This getter returns a string that explicitly changes when metadata (note/reminder) updates.
				// This is REQUIRED because the 'id' field stays static, which would otherwise cause AG Grid 
				// to optimize away the re-render. DO NOT revert to field: "id".
				return `${data.id}_${data.actionNote ? "note" : ""}_${data.reminder ? "rem" : ""}_${data.hasAttachment ? "att" : ""}`;
			},
			checkboxSelection: false,
			headerCheckboxSelection: false,
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
			suppressHeaderMenuButton: true,
			cellClass: "flex items-center justify-center",
		},
		{
			headerName: "STATS",
			field: "status",
			cellRenderer: StatusRenderer,
			width: 80,
			editable: false,
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
