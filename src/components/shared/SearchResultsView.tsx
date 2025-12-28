"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { ColDef } from "ag-grid-community";
import { Search as SearchIcon, X } from "lucide-react";
import {
	getBaseColumns,
	PartStatusRenderer,
} from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

// Custom renderer for Source Tag
const SourceRenderer = (params: any) => {
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

export const SearchResultsView = () => {
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const rowData = useAppStore((state) => state.rowData); // Main Sheet
	const ordersRowData = useAppStore((state) => state.ordersRowData); // Orders
	const bookingRowData = useAppStore((state) => state.bookingRowData); // Booking
	const callRowData = useAppStore((state) => state.callRowData); // Call List
	const archiveRowData = useAppStore((state) => state.archiveRowData); // Archive
	const partStatuses = useAppStore((state) => state.partStatuses); // Part Status Definitions
	const updatePartStatus = useAppStore((state) => state.updatePartStatus); // Action to persist status changes

	// Aggregate Data
	const searchResults = useMemo(() => {
		if (!searchTerm || searchTerm.trim().length === 0) return [];

		const terms = searchTerm
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		if (terms.length === 0) return [];

		const allRows = [
			...rowData.map((r) => ({ ...r, sourceType: "Main Sheet" })),
			...ordersRowData.map((r) => ({ ...r, sourceType: "Orders" })),
			...bookingRowData.map((r) => ({ ...r, sourceType: "Booking" })),
			...callRowData.map((r) => ({ ...r, sourceType: "Call" })),
			...archiveRowData.map((r) => ({ ...r, sourceType: "Archive" })),
		];

		return allRows.filter((row) => {
			// Create a giant searchable string
			const searchString = [
				row.sourceType,
				row.vin,
				row.customerName,
				row.partNumber,
				row.description,
				row.mobile,
				row.baseId,
				row.trackingId,
				row.model,
				row.requester,
				row.noteContent,
				row.repairSystem,
				row.actionNote,
				row.bookingNote,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			// Check if ALL terms match (AND logic)
			return terms.every((term) => searchString.includes(term));
		});
	}, [
		searchTerm,
		rowData,
		ordersRowData,
		bookingRowData,
		callRowData,
		archiveRowData,
	]);

	const handleClearSearch = () => {
		setSearchTerm("");
	};

	// Columns Configuration
	const columns = useMemo((): ColDef<PendingRow>[] => {
		const baseCols = getBaseColumns();

		return [
			{
				headerName: "SOURCE",
				field: "sourceType",
				width: 100,
				cellRenderer: SourceRenderer,
				pinned: "left",
				filter: true,
			},
			...baseCols,
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
	}, [partStatuses]);

	// Summary Counts
	const counts = useMemo(() => {
		return searchResults.reduce(
			(acc, curr) => {
				const source = curr.sourceType || "Unknown";
				acc[source] = (acc[source] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
	}, [searchResults]);

	if (!searchTerm) return null;

	return (
		<div className="flex flex-col h-full bg-[#0a0a0b] text-white">
			{/* Header / Summary Bar */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0b]/50 backdrop-blur-xl">
				<div className="flex items-center gap-4">
					<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
						<SearchIcon className="w-5 h-5" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-white/90">
							Global Search Results
						</h2>
						<div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
							<span className="text-white font-medium">
								{searchResults.length}
							</span>{" "}
							matches for
							<span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">
								"{searchTerm}"
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{Object.entries(counts).map(([source, count]) => (
						<div
							key={source}
							className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300"
						>
							<span
								className={cn("w-1.5 h-1.5 rounded-full", {
									"bg-indigo-500": source === "Main Sheet",
									"bg-orange-500": source === "Orders",
									"bg-purple-500": source === "Booking",
									"bg-blue-500": source === "Call",
									"bg-slate-500": source === "Archive",
								})}
							/>
							<span>{source}</span>
							<span className="text-gray-500 ml-1 font-mono">{count}</span>
						</div>
					))}
					<div className="w-px h-6 bg-white/10 mx-2" />
					<Button
						onClick={handleClearSearch}
						variant="ghost"
						size="sm"
						className="text-gray-400 hover:text-white hover:bg-white/5"
					>
						<X className="w-4 h-4 mr-2" />
						Clear Search
					</Button>
				</div>
			</div>

			{/* Grid Content */}
			<div className="flex-1 p-6 overflow-hidden">
				{searchResults.length > 0 ? (
					<div className="h-full w-full rounded-xl border border-white/10 overflow-hidden bg-[#141416]/50 shadow-2xl ring-1 ring-white/5">
						<div className="ag-theme-alpine-dark h-full w-full">
							<AgGridReact
								rowData={searchResults}
								columnDefs={columns}
								defaultColDef={{
									sortable: true,
									filter: true,
									resizable: true,
									suppressMenu: true,
								}}
								rowHeight={32}
								headerHeight={36}
								animateRows={true}
								rowSelection="multiple"
								suppressCellFocus={true}
								onCellValueChanged={(event) => {
									if (event.colDef.field === "partStatus" && event.data?.id) {
										updatePartStatus(event.data.id, event.newValue);
									}
								}}
							/>
						</div>
					</div>
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
							onClick={handleClearSearch}
							variant="outline"
							className="mt-4 border-white/10 hover:bg-white/5"
						>
							Clear Search Input
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
