"use client";

import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { getEffectiveNoteHistory } from "@/lib/orderWorkflow";
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
  // Index 0: Checkbox column placeholder
  {
    headerName: "",
    colId: "checkbox-selection-col",
    width: 50,
    maxWidth: 50,
    sortable: false,
    filter: false,
    resizable: false,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    lockPosition: "left",
  },
  // Index 1: ACTIONS column (second column, after checkbox)
  {
    headerName: "ACTIONS",
    colId: "row-actions",
    // field: "id", // REMOVED: Using ID suppresses updates if ID doesn't change
    // Use valueGetter to force re-render when relevant data changes
    valueGetter: (params) => {
      const data = params.data;
      if (!data) return "";
      // [CRITICAL] COMPOSITE KEY FOR REACTIVITY
      // This getter returns a string that explicitly changes when metadata (note/reminder) updates.
      // This is REQUIRED because the 'id' field stays static, which would otherwise cause AG Grid
      // to optimize away the re-render. DO NOT revert to field: "id".
      return `${data.id}_${getEffectiveNoteHistory(data) ? "note" : ""}_${data.reminder ? "rem" : ""}_${data.hasAttachment ? "att" : ""}`;
    },
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
      params.value || "pendingsystem",
    comparator: (
      valueA: string | null | undefined,
      valueB: string | null | undefined,
    ) => {
      const keyA = valueA || "pendingsystem";
      const keyB = valueB || "pendingsystem";
      if (keyA === keyB) return 0;
      return keyA > keyB ? 1 : -1;
    },
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
  partStatuses: PartStatusDef[] = [],
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
    valueFormatter: (params: ValueFormatterParams<PendingRow>) => {
      if (!params.value) return "";
      try {
        return format(new Date(params.value), "EEE, MMM d, yyyy");
      } catch {
        return params.value;
      }
    },
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
  {
    headerName: "PART STATUS",
    field: "partStatus",
    width: 100,
    minWidth: 100,
    editable: false,
    cellRenderer: PartStatusRenderer,
    cellRendererParams: {
      partStatuses: Array.isArray(partStatuses) ? partStatuses : [],
    },
    cellClass: "flex items-center justify-center",
  },
];

export const getCallColumns = (
  partStatuses: PartStatusDef[] = [],
  onNoteClick?: (row: PendingRow) => void,
  onReminderClick?: (row: PendingRow) => void,
  onAttachClick?: (row: PendingRow) => void,
): ColDef<PendingRow>[] => {
  const baseColumns = getBaseColumns(
    onNoteClick,
    onReminderClick,
    onAttachClick,
  );
  return [
    ...baseColumns.slice(0, 3), // Include checkbox, actions, stats
    { headerName: "BOOKING", field: "bookingDate", width: 120 },
    ...baseColumns.slice(3), // Continue from R/DATE onwards
    {
      headerName: "PART STATUS",
      field: "partStatus",
      width: 100,
      minWidth: 100,
      editable: false,
      cellRenderer: PartStatusRenderer,
      cellRendererParams: {
        partStatuses: Array.isArray(partStatuses) ? partStatuses : [],
      },
      cellClass: "flex items-center justify-center",
    },
  ];
};

export type SearchHeaderCheckboxState = boolean | "indeterminate";

interface SearchHeaderCheckboxProps {
  state: SearchHeaderCheckboxState;
  onChange?: (selected: boolean) => void;
}

const SearchHeaderCheckbox = ({
  state,
  onChange,
}: SearchHeaderCheckboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = state === "indeterminate";
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <input
        ref={inputRef}
        type="checkbox"
        checked={state === true}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-indigo-500 focus:ring-0 focus:ring-offset-0"
      />
    </div>
  );
};

const SearchCheckboxRenderer = (params: ICellRendererParams<PendingRow>) => {
  const [selected, setSelected] = useState(params.node.isSelected() ?? false);

  useEffect(() => {
    const handler = () => setSelected(params.node.isSelected() ?? false);
    params.node.addEventListener("rowSelected", handler);
    return () => params.node.removeEventListener("rowSelected", handler);
  }, [params.node]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.target.checked = !selected;
    params.node.setSelected(!selected);
  };

  return (
    <div className="flex items-center justify-center h-full w-full">
      <input
        type="checkbox"
        checked={selected}
        onChange={handleChange}
        className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
      />
    </div>
  );
};

// INVARIANT: DO NOT RESTRICT SEARCH COLUMNS OR REMOVE CHECKBOX. THIS IS A COMMAND CENTER.
export const getGlobalSearchWorkspaceColumns = (
  partStatuses: PartStatusDef[] = [],
  onNoteClick?: (row: PendingRow, source?: string) => void,
  onReminderClick?: (row: PendingRow) => void,
  onAttachClick?: (row: PendingRow, source?: string) => void,
  masterCheckboxStateRef?: React.RefObject<SearchHeaderCheckboxState>,
  onSelectAllFiltered?: (selected: boolean) => void,
): ColDef<PendingRow>[] => {
  const baseCols = getBaseColumns(onNoteClick, onReminderClick, onAttachClick);

  // Extract specific columns by colId/field for reuse
  const statsCol = baseCols.find((c) => c.headerName === "STATS");
  const rDateCol = baseCols.find((c) => c.field === "rDate");
  const companyCol = baseCols.find((c) => c.field === "company");
  const customerCol = baseCols.find((c) => c.field === "customerName");
  const vinCol = baseCols.find((c) => c.field === "vin");
  const mobileCol = baseCols.find((c) => c.field === "mobile");
  const cntrRdgCol = baseCols.find((c) => c.field === "cntrRdg");
  const sabCol = baseCols.find((c) => c.field === "sabNumber");
  const acceptedByCol = baseCols.find((c) => c.field === "acceptedBy");
  const modelCol = baseCols.find((c) => c.field === "model");
  const partNumberCol = baseCols.find((c) => c.field === "partNumber");
  const descriptionCol = baseCols.find((c) => c.field === "description");
  const repairSystemCol = baseCols.find((c) => c.field === "repairSystem");
  const warrantyCol = baseCols.find((c) => c.field === "remainTime");
  const actionsCol = baseCols.find((c) => c.colId === "row-actions");

  return [
    // 1. SOURCE
    {
      headerName: "SOURCE",
      field: "sourceType" as any,
      width: 96,
      minWidth: 96,
      maxWidth: 96,
      suppressSizeToFit: true,
      pinned: "left" as const,
      cellRenderer: (params: any) => {
        const source = params.value;
        let colorClass = "bg-gray-500/10 text-gray-500 border-gray-500/20";
        if (source === "Main Sheet")
          colorClass = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
        if (source === "Orders")
          colorClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
        if (source === "Booking")
          colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
        if (source === "Call")
          colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        if (source === "Archive")
          colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";

        return (
          <div className="flex items-center h-full w-full">
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${colorClass}`}
            >
              {source}
            </span>
          </div>
        );
      },
    },
    // 2. CHECKBOX (Custom)
    {
      headerName: "",
      colId: "search-checkbox",
      width: 52,
      minWidth: 52,
      maxWidth: 52,
      suppressSizeToFit: true,
      pinned: "left" as const,
      sortable: false,
      filter: false,
      headerComponent: () => (
        <SearchHeaderCheckbox
          state={masterCheckboxStateRef?.current ?? false}
          onChange={onSelectAllFiltered}
        />
      ),
      cellRenderer: SearchCheckboxRenderer,
    },
    // 3. ACTIONS
    {
      ...(actionsCol || {}),
      width: 96,
      minWidth: 96,
      maxWidth: 96,
      suppressSizeToFit: true,
      pinned: "left" as const,
    },
    // 4. Main Sheet Sequence
    { ...(statsCol || {}), width: 80 },
    { ...(rDateCol || {}), width: 100 },
    { ...(companyCol || {}), width: 90 },
    {
      ...(customerCol || {}),
      minWidth: 180,
      flex: 1,
    },
    {
      ...(vinCol || {}),
      minWidth: 180,
    },
    {
      ...(mobileCol || {}),
      minWidth: 130,
    },
    { ...(cntrRdgCol || {}), width: 90 },
    { ...(sabCol || {}), width: 110 },
    { ...(acceptedByCol || {}), width: 120 },
    { ...(modelCol || {}), width: 100 },
    { ...(partNumberCol || {}), minWidth: 120 },
    { ...(descriptionCol || {}), minWidth: 180, flex: 2 },
    { ...(repairSystemCol || {}), width: 100 },
    { ...(warrantyCol || {}), width: 100 },
    // 5. PART STATUS
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
  ].filter(
    (col) =>
      col &&
      (Object.hasOwn(col, "field") ||
        Object.hasOwn(col, "colId") ||
        col.headerName),
  ) as ColDef<PendingRow>[];
};
