"use client";

import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { gridTheme } from "@/lib/ag-grid-setup";
import type { PendingRow } from "@/types";

interface SearchResultsGridProps {
	rowData: any[];
	columnDefs: ColDef[];
	onCellValueChanged: (event: any) => void;
}

export const SearchResultsGrid = ({
	rowData,
	columnDefs,
	onCellValueChanged,
}: SearchResultsGridProps) => {
	return (
		<div className="h-full w-full rounded-xl border border-white/10 overflow-hidden bg-[#141416]/50 shadow-2xl ring-1 ring-white/5">
			<div className="h-full w-full">
				<AgGridReact
					theme={gridTheme}
					rowData={rowData}
					columnDefs={columnDefs}
					defaultColDef={{
						sortable: true,
						filter: true,
						resizable: true,
						suppressHeaderMenuButton: true,
					}}
					rowHeight={32}
					headerHeight={36}
					animateRows={true}
					rowSelection={{
						mode: "multiRow",
						enableClickSelection: true,
						checkboxes: false,
						headerCheckbox: false,
					}}
					suppressCellFocus={true}
					onCellValueChanged={onCellValueChanged}
				/>
			</div>
		</div>
	);
};
