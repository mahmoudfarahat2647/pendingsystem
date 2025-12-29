import type { ColDef } from "ag-grid-community";

export const columnTypes: Record<string, ColDef> = {
	numberColumn: {
		width: 90,
		filter: "agNumberColumnFilter",
	},
	textColumn: {
		filter: "agTextColumnFilter",
	},
	dateColumn: {
		filter: "agDateColumnFilter",
		width: 120,
	},
	actionColumn: {
		sortable: false,
		filter: false,
		resizable: false,
		pinned: "right",
		width: 100,
	},
};
