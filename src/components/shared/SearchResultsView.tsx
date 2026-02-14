"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	ICellRendererParams,
} from "ag-grid-community";
import { format } from "date-fns";
import { Search as SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PartStatusRenderer } from "@/components/grid/renderers";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import {
	useBulkUpdateOrderStageMutation,
	useOrdersQuery,
	useSaveOrderMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useRowModals } from "@/hooks/useRowModals";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { RowModals } from "./RowModals";
import { SearchResultsGrid } from "./search/SearchResultsGrid";
import { SearchResultsHeader } from "./search/SearchResultsHeader";

type SearchResultRow = PendingRow & { sourceType: string };

// Custom renderer for Source Tag
const SourceRenderer = (params: ICellRendererParams) => {
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
				className={cn(
					"px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
					colorClass,
				)}
			>
				{source}
			</span>
		</div>
	);
};

// Helper to build a searchable string from a row
const buildSearchString = (row: SearchResultRow) => {
	return [
		row.sourceType,
		row.vin,
		row.customerName,
		row.partNumber,
		row.description,
		row.mobile,
		row.baseId,
		row.trackingId,
		row.model,
		row.company || "pendingsystem",
		row.requester,
		row.sabNumber,
		row.acceptedBy,
		row.rDate,
		row.noteContent,
		row.repairSystem,
		row.actionNote,
		row.bookingDate,
		row.bookingNote,
		row.archiveReason,
	]
		.map((field) => (field ? String(field).toLowerCase() : ""))
		.join(" ");
};

const isPartStatusChangeEvent = (
	event: CellValueChangedEvent<SearchResultRow>,
): boolean => {
	return (
		event.colDef.field === "partStatus" &&
		Boolean(event.data?.id) &&
		event.newValue !== event.oldValue
	);
};

const getRelevantPartsBySource = (
	sourceType: string,
	vin: string,
	mainRows: PendingRow[],
	orderRows: PendingRow[],
): PendingRow[] => {
	if (sourceType === "Main Sheet") {
		return mainRows.filter((row) => row.vin === vin);
	}

	if (sourceType === "Orders") {
		return orderRows.filter((row) => row.vin === vin);
	}

	return [];
};

const areAllRelevantPartsArrived = (
	relevantParts: PendingRow[],
	updatedPartId: string,
): boolean => {
	return relevantParts.every((row) => {
		if (row.id === updatedPartId) return true;
		return row.partStatus?.toLowerCase() === "arrived";
	});
};

export const SearchResultsView = () => {
	// Specific selectors to avoid broad re-renders
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const partStatuses = useAppStore((state) => state.partStatuses);

	// Filter state
	const [activeSources, setActiveSources] = useState<string[]>([]);

	const _handleToggleSource = useCallback((source: string) => {
		setActiveSources((prev) =>
			prev.includes(source)
				? prev.filter((s) => s !== source)
				: [...prev, source],
		);
	}, []);

	// Fetch data from React Query
	const { data: rowData = [] } = useOrdersQuery("main");
	const { data: ordersRowData = [] } = useOrdersQuery("orders");
	const { data: bookingRowData = [] } = useOrdersQuery("booking");
	const { data: callRowData = [] } = useOrdersQuery("call");
	const { data: archiveRowData = [] } = useOrdersQuery("archive");

	const saveOrderMutation = useSaveOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation();

	// Primary tagged dataset
	const allRows = useMemo((): SearchResultRow[] => {
		return [
			...rowData.map((r) => ({ ...r, sourceType: "Main Sheet" })),
			...ordersRowData.map((r) => ({ ...r, sourceType: "Orders" })),
			...bookingRowData.map((r) => ({ ...r, sourceType: "Booking" })),
			...callRowData.map((r) => ({ ...r, sourceType: "Call" })),
			...archiveRowData.map((r) => ({ ...r, sourceType: "Archive" })),
		];
	}, [rowData, ordersRowData, bookingRowData, callRowData, archiveRowData]);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>, stage?: string) => {
			let mappedStage = stage?.toLowerCase() || "main";
			if (mappedStage === "main sheet") mappedStage = "main";

			const validStages = ["orders", "main", "call", "booking", "archive"];
			if (!validStages.includes(mappedStage)) {
				mappedStage = "main";
			}

			return saveOrderMutation.mutateAsync({
				id,
				updates,
				stage: mappedStage as any,
			});
		},
		[saveOrderMutation],
	);

	const {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
		sourceTag,
	} = useRowModals(handleUpdateOrder);

	// Search Results derivation
	const searchResults = useMemo(() => {
		if (!searchTerm || searchTerm.trim().length === 0) return [];

		const terms = searchTerm
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		if (terms.length === 0) return [];

		const filteredBySearch = allRows.filter((row) => {
			const searchString = buildSearchString(row);
			return terms.every((term) => searchString.includes(term));
		});

		if (activeSources.length === 0) return filteredBySearch;
		return filteredBySearch.filter((row) =>
			activeSources.includes(row.sourceType),
		);
	}, [searchTerm, allRows, activeSources]);

	const columns = useMemo((): ColDef<PendingRow>[] => {
		const baseCols = getBaseColumns(
			(row) => handleNoteClick(row, (row as any).sourceType),
			(row) => handleReminderClick(row),
			(row) => handleAttachClick(row),
		);

		const actionsCol = baseCols.find((col) => col.colId === "actions");
		const configuredActionsCol: ColDef<PendingRow> = actionsCol
			? {
					...actionsCol,
					checkboxSelection: true,
					headerCheckboxSelection: false,
					pinned: "left",
				}
			: {
					headerName: "ACTIONS",
					field: "id",
					colId: "actions",
					pinned: "left",
					checkboxSelection: true,
					headerCheckboxSelection: false,
					width: 100,
				};

		const remainingBaseCols = baseCols.filter(
			(col) => col.colId !== "selection" && col.colId !== "actions",
		);

		return [
			{
				headerName: "SOURCE",
				field: "sourceType",
				width: 100,
				cellRenderer: SourceRenderer,
				pinned: "left",
				filter: true,
			},
			{
				headerName: "BOOKING",
				field: "bookingDate",
				width: 120,
				valueFormatter: (params) => {
					if (!params.value) return "";
					try {
						return format(new Date(params.value), "EEE, MMM d, yyyy");
					} catch {
						return params.value;
					}
				},
			},
			configuredActionsCol,
			...remainingBaseCols,
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
	}, [partStatuses, handleNoteClick, handleReminderClick, handleAttachClick]);

	const counts = useMemo(() => {
		const terms =
			searchTerm
				?.toLowerCase()
				.split(/\s+/)
				.filter((t) => t.length > 0) || [];
		if (terms.length === 0) return {};

		const filteredBySearch = allRows.filter((row) => {
			const searchString = buildSearchString(row);
			return terms.every((term) => searchString.includes(term));
		});

		return filteredBySearch.reduce(
			(acc, curr) => {
				const source = curr.sourceType || "Unknown";
				acc[source] = (acc[source] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
	}, [searchTerm, allRows]);

	const onCellValueChanged = useCallback(
		async (event: CellValueChangedEvent<SearchResultRow>) => {
			if (!isPartStatusChangeEvent(event)) return;

			const newStatus = event.newValue;
			const vin = event.data.vin;
			const sourceType = event.data.sourceType;

			// Await the update to avoid race conditions with bulk move
			await handleUpdateOrder(event.data.id, { partStatus: newStatus }, sourceType);

			// check status case-insensitively or as provided in labels
			const isArrived = newStatus?.toLowerCase() === "arrived";
			if (!isArrived || !vin) {
				toast.success("Part status updated");
				return;
			}

			const relevantParts = getRelevantPartsBySource(
				sourceType,
				vin,
				rowData,
				ordersRowData,
			);
			if (relevantParts.length === 0) return;

			const allArrived = areAllRelevantPartsArrived(relevantParts, event.data.id);
			if (!allArrived) return;

			const ids = relevantParts.map((part) => part.id);
			await bulkUpdateStageMutation.mutateAsync({ ids, stage: "call" });
			toast.success(`All parts for VIN ${vin} arrived! Moved to Call List.`, {
				duration: 5000,
			});
		},
		[handleUpdateOrder, rowData, ordersRowData, bulkUpdateStageMutation],
	);

	if (!searchTerm) return null;

	return (
		<div className="flex flex-col h-full bg-[#0a0a0b] text-white">
			<SearchResultsHeader
				searchTerm={searchTerm}
				resultsCount={searchResults.length}
				counts={counts}
				onClearSearch={() => setSearchTerm("")}
			/>
			<div className="flex-1 p-6 overflow-hidden">
				{searchResults.length > 0 ? (
					<SearchResultsGrid
						rowData={searchResults}
						columnDefs={columns}
						onCellValueChanged={onCellValueChanged}
					/>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
						<div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
							<SearchIcon className="w-8 h-8 text-gray-600" />
						</div>
						<div>
							<h3 className="text-lg font-medium text-white/80">
								No results found
							</h3>
							<p className="text-sm text-gray-500 mt-1 max-w-xs">
								We couldn't find any records matching "{searchTerm}". Try
								different keywords or check spelling.
							</p>
						</div>
						<Button
							onClick={() => setSearchTerm("")}
							variant="outline"
							className="mt-4 border-white/10 hover:bg-white/5"
						>
							Clear Search Input
						</Button>
					</div>
				)}
			</div>
			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={saveArchive}
				sourceTag={sourceTag}
			/>
		</div>
	);
};
