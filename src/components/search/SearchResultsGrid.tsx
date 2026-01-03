import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { PartStatusRenderer } from "@/components/grid/renderers";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { gridTheme } from "@/lib/ag-grid-setup";
import { cn } from "@/lib/utils";
import type { PartStatusDef, PendingRow } from "@/types";

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

import type { OrderStage } from "@/services/orderService";

interface SearchResultsGridProps {
	searchResults: PendingRow[];
	partStatuses: PartStatusDef[];
	rowData: PendingRow[];
	ordersRowData: PendingRow[];
	onUpdateOrder: (
		id: string,
		updates: Partial<PendingRow>,
		stage?: string,
	) => void;
	onUpdateStage: (params: { id: string; stage: OrderStage }) => Promise<void>;
}

export const SearchResultsGrid = ({
	searchResults,
	partStatuses,
	rowData,
	ordersRowData,
	onUpdateOrder,
	onUpdateStage,
}: SearchResultsGridProps) => {
	const columns = useMemo((): ColDef<PendingRow>[] => {
		const baseCols = getBaseColumns();

		return [
			{
				headerName: "SOURCE",
				// biome-ignore lint/suspicious/noExplicitAny: Dynamic field for AG Grid
				field: "sourceType" as any,
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

	return (
		<div className="h-full w-full rounded-xl border border-white/10 overflow-hidden bg-[#141416]/50 shadow-2xl ring-1 ring-white/5">
			<div className="h-full w-full">
				<AgGridReact
					theme={gridTheme}
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
					onCellValueChanged={async (event) => {
						if (
							event.colDef.field === "partStatus" &&
							event.data?.id &&
							event.newValue !== event.oldValue
						) {
							const newStatus = event.newValue;
							const vin = event.data.vin;
							// biome-ignore lint/suspicious/noExplicitAny: Dynamic field for AG Grid
							const sourceType = (event.data as any).sourceType;

							// 1. Persist the change
							onUpdateOrder(
								event.data.id,
								{
									partStatus: newStatus,
								},
								sourceType,
							);

							// 2. Check for auto-move to Call List
							if (newStatus === "Arrived" && vin) {
								let relevantParts: PendingRow[] = [];

								if (sourceType === "Main Sheet") {
									relevantParts = rowData.filter((r) => r.vin === vin);
								} else if (sourceType === "Orders") {
									relevantParts = ordersRowData.filter((r) => r.vin === vin);
								}

								if (relevantParts.length > 0) {
									const allArrived = relevantParts.every((r) => {
										if (r.id === event.data.id) return true;
										return r.partStatus === "Arrived";
									});

									if (allArrived) {
										for (const part of relevantParts) {
											await onUpdateStage({
												id: part.id,
												stage: "call",
											});
										}
										toast.success(
											`All parts for VIN ${vin} arrived! Moved to Call List.`,
											{ duration: 5000 },
										);
									}
								}
							} else {
								toast.success("Part status updated");
							}
						}
					}}
				/>
			</div>
		</div>
	);
};
