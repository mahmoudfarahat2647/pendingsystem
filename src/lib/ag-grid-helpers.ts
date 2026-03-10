import type { GridApi, IRowNode } from "ag-grid-community";

export interface JumpResult {
    success: boolean;
    reason?:
    | "no-row-id"
    | "grid-not-ready"
    | "grid-destroyed"
    | "row-not-found";
}

/**
 * Attempts to safely jump to a row in the AG Grid instance.
 * Ensures that grid is ready, locates the row, deselects others,
 * selects the target, scrolls to it, and flashes it for visual confirmation.
 */
export function tryJumpToRow(
    gridApi: GridApi | null | undefined,
    rowId: string | null | undefined,
): JumpResult {
    if (!rowId) {
        return { success: false, reason: "no-row-id" };
    }

    if (!gridApi) {
        return { success: false, reason: "grid-not-ready" };
    }

    try {
        // A safe way to check if the grid API is destroyed
        if (gridApi.isDestroyed()) {
            return { success: false, reason: "grid-destroyed" };
        }
        // Also verify we can access rows
        gridApi.getDisplayedRowCount();
    } catch {
        return { success: false, reason: "grid-destroyed" };
    }

    const rowNode: IRowNode | undefined = gridApi.getRowNode(rowId) ?? undefined;

    if (!rowNode) {
        return { success: false, reason: "row-not-found" };
    }

    // 1. Clear any previous selections
    gridApi.deselectAll();

    // 2. Select ONLY the target row
    rowNode.setSelected(true, true, "api");

    // 3. Ensure the node is visible in the viewport
    gridApi.ensureNodeVisible(rowNode, "middle");

    // 4. Flash the cells to draw attention
    gridApi.flashCells({
        rowNodes: [rowNode],
        flashDuration: 500,
        fadeDuration: 500,
    });

    return { success: true };
}
