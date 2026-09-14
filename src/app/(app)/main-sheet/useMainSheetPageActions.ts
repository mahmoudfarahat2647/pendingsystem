"use client";

import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
	getSelectedIds,
	getVinAutoMoveIds,
} from "@/domain/order/orderWorkflow";
import type { useDraftSession } from "@/hooks/useDraftSession";
import {
	buildBookingCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
} from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

export function useMainSheetPageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
	effectiveRows: PendingRow[];
	selectedRows: PendingRow[];
	setSelectedRows: React.Dispatch<React.SetStateAction<PendingRow[]>>;
	freezeRows?: PendingRow[];
}) {
	const {
		applyCommand,
		effectiveRows,
		selectedRows,
		setSelectedRows,
		freezeRows = [],
	} = params;

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "main",
				destinationStage: "main",
				updates,
				previousValues: {},
			});
			return Promise.resolve();
		},
		[applyCommand],
	);

	const handleSendToArchive = useCallback(
		(ids: string[], reason: string) => {
			const rows = ids.flatMap((id) => {
				const row = effectiveRows.find((r: PendingRow) => r.id === id);
				return row ? [row] : [];
			});
			for (const cmd of buildSendToArchiveCommands(rows, reason, "main")) {
				applyCommand(cmd);
			}
		},
		[effectiveRows, applyCommand],
	);

	const handleConfirmBooking = async (
		date: string,
		note: string,
		status?: string,
	) => {
		for (const cmd of buildBookingCommands(
			selectedRows,
			"main",
			date,
			note,
			status,
		)) {
			applyCommand(cmd);
		}
		setSelectedRows([]);
		toast.success(`${selectedRows.length} row(s) sent to Booking`);
	};

	const handleConfirmReorder = async (
		reason: string,
		onComplete: () => void,
	) => {
		if (!reason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		for (const cmd of buildReorderCommands(selectedRows, "main", reason)) {
			applyCommand(cmd);
		}
		const count = selectedRows.length;
		setSelectedRows([]);
		onComplete();
		toast.success(`${count} row(s) sent back to Orders (Reorder)`);
	};

	const handleSendToCallList = async () => {
		if (selectedRows.length === 0) return;
		const ids = getSelectedIds(selectedRows);
		applyCommand({
			type: "moveRows",
			ids,
			sourceStage: "main",
			destinationStage: "call",
		});
		setSelectedRows([]);
		toast.success(`${ids.length} item(s) sent to Call List`);
	};

	const handleConfirmDelete = async () => {
		applyCommand({
			type: "deleteRows",
			ids: getSelectedIds(selectedRows),
		});
		setSelectedRows([]);
		toast.success("Row(s) deleted");
	};

	const handleUpdatePartStatus = async (status: string) => {
		if (selectedRows.length === 0) return;

		// 1. Apply patch commands for all status changes
		for (const row of selectedRows) {
			applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { status },
				previousValues: { status: row.status },
			});
		}

		// 2. Check each unique VIN for auto-move to Call List
		const uniqueVins = [
			...new Set(selectedRows.map((r) => r.vin).filter(Boolean)),
		];

		for (const vin of uniqueVins) {
			// Use the first row edited for that VIN as the editedRowId
			const editedRow = selectedRows.find((r) => r.vin === vin);
			if (!editedRow) continue;

			const vinIds = getVinAutoMoveIds({
				stage: "main",
				stageRows: effectiveRows,
				editedRowId: editedRow.id,
				editedVin: vin,
				nextStatus: status,
				frozenRows: freezeRows,
			});

			if (vinIds.length > 0) {
				applyCommand({
					type: "moveRows",
					ids: vinIds,
					sourceStage: "main",
					destinationStage: "call",
					guardFrozenVins: true,
				});
				toast.success(`All parts for VIN ${vin} arrived! Moved to Call List.`, {
					duration: 5000,
				});
			}
		}

		toast.success(`Part status updated to "${status}"`);
	};

	return {
		handleUpdateOrder,
		handleSendToArchive,
		handleConfirmBooking,
		handleConfirmReorder,
		handleUpdatePartStatus,
		handleSendToCallList,
		handleConfirmDelete,
	};
}
