import { useIsMutating } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";

/**
 * Synchronizes selected rows with the latest underlying row data to prevent stale data references.
 */
export function useSelectedRowsSync<T extends { id: string }>(
	stage: string,
	rowData: T[],
	selectedRows: T[],
	setSelectedRows: Dispatch<SetStateAction<T[]>>,
) {
	const prevRowDataRef = useRef(rowData);

	// We only pause selection pruning when order updates/deletions are pending.
	// This prevents clearing the user's selection immediately during an optimistic update
	// that might roll back.
	const isUpdating = useIsMutating({
		mutationKey: ["bulk-update-stage", stage],
	});
	const isDeleting = useIsMutating({
		mutationKey: ["bulk-delete-orders", stage],
	});
	const isMutating = isUpdating + isDeleting > 0;

	const prevIsMutatingRef = useRef(isMutating);

	const isEmpty = selectedRows.length === 0;

	useEffect(() => {
		if (
			rowData === prevRowDataRef.current &&
			isMutating === prevIsMutatingRef.current
		) {
			return;
		}

		prevRowDataRef.current = rowData;
		prevIsMutatingRef.current = isMutating;

		setSelectedRows((prevSelected) => {
			if (prevSelected.length === 0) return prevSelected;

			const updatedSelection = prevSelected
				.map((sel) => {
					const found = rowData.find((r) => r.id === sel.id);
					return found ?? (isMutating ? sel : undefined);
				})
				.filter((row): row is T => Boolean(row));

			const hasChanges =
				updatedSelection.length !== prevSelected.length ||
				updatedSelection.some((row, idx) => row !== prevSelected[idx]);

			return hasChanges ? updatedSelection : prevSelected;
		});
	}, [rowData, isMutating, setSelectedRows]);
}
