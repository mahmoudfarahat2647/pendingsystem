import type { GridOptions } from "ag-grid-community";

export const defaultGridOptions: GridOptions = {
	// Row Virtualization
	rowBuffer: 10,
	rowModelType: "clientSide",

	// Performance flags
	animateRows: false,
	suppressColumnVirtualisation: false,
	suppressRowVirtualisation: false,
	suppressPropertyNamesCheck: true,

	// Batch processing
	asyncTransactionWaitMillis: 50,

	// DOM optimization
	suppressCellFocus: false,
	enableCellTextSelection: true,
	debounceVerticalScrollbar: true,

	// Selection
	rowSelection: {
		mode: "multiRow",
		checkboxes: false,
		headerCheckbox: false,
		enableClickSelection: true,
		selectAll: "filtered",
	},

	// Suppress unnecessary features
	suppressDragLeaveHidesColumns: true,
	suppressMakeColumnVisibleAfterUnGroup: true,
};

export const defaultColDef = {
	sortable: true,
	filter: true,
	resizable: true,
	minWidth: 80,
	filterParams: {
		debounceMs: 200,
		buttons: ["reset", "apply"],
	},
};
