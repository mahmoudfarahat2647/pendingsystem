import type { GridApi, IRowNode } from "ag-grid-community";
import { vi } from "vitest";
import type { PendingRow } from "@/types";

type MockGridNode = Pick<
	IRowNode<PendingRow>,
	"group" | "selectable" | "isSelected" | "setSelected" | "data"
>;

export type MockGridApi = Pick<
	GridApi<PendingRow>,
	| "selectAllFiltered"
	| "deselectAllFiltered"
	| "forEachNodeAfterFilter"
	| "forEachNode"
	| "getSelectedRows"
	| "refreshHeader"
>;

export const createMockGridNode = ({
	selected = false,
	group = false,
	selectable = true,
	data,
}: {
	selected?: boolean;
	group?: boolean;
	selectable?: boolean;
	data?: PendingRow;
} = {}): MockGridNode & { _selected: boolean } => {
	const node = {
		group,
		selectable,
		data,
		_selected: selected,
		isSelected: vi.fn(() => node._selected),
		setSelected: vi.fn((sel: boolean) => {
			node._selected = sel;
		}),
	};
	return node;
};

export const createMockGridApi = ({
	selectedRows = [],
	filteredNodes = [],
	allNodes,
}: {
	selectedRows?: PendingRow[];
	filteredNodes?: MockGridNode[];
	allNodes?: MockGridNode[];
} = {}): MockGridApi => {
	const _allNodes = allNodes ?? filteredNodes;
	return {
		selectAllFiltered: vi.fn(),
		deselectAllFiltered: vi.fn(),
		refreshHeader: vi.fn(),
		getSelectedRows: vi.fn(() => {
			// If we provided stateful nodes (with _selected), derive selectedRows from them
			// Otherwise fallback to the static selectedRows
			const statefulSelectedData = _allNodes.flatMap((n) =>
				n.isSelected() && n.data ? [n.data] : [],
			);

			if (
				statefulSelectedData.length > 0 ||
				_allNodes.some((n) => Reflect.has(n, "_selected"))
			) {
				return statefulSelectedData;
			}
			return selectedRows;
		}),
		forEachNodeAfterFilter: vi.fn((callback) => {
			for (const [index, node] of filteredNodes.entries()) {
				callback(node as IRowNode<PendingRow>, index);
			}
		}),
		forEachNode: vi.fn((callback) => {
			for (const [index, node] of _allNodes.entries()) {
				callback(node as IRowNode<PendingRow>, index);
			}
		}),
	};
};
