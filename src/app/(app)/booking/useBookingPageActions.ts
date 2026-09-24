"use client";

import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import { getSelectedIds } from "@/domain/order/orderWorkflow";
import type { useDraftSession } from "@/hooks/useDraftSession";
import {
	buildMoveToMainCommands,
	buildRebookingCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
	buildSendToFreezeCommands,
} from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

export function useBookingPageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
	effectiveRows: PendingRow[];
	selectedRows: PendingRow[];
	setSelectedRows: React.Dispatch<React.SetStateAction<PendingRow[]>>;
}) {
	const { applyCommand, effectiveRows, selectedRows, setSelectedRows } = params;

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "booking",
				destinationStage: "booking",
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
			for (const cmd of buildSendToArchiveCommands(rows, reason, "booking")) {
				applyCommand(cmd);
			}
		},
		[effectiveRows, applyCommand],
	);

	const handleSendToFreeze = useCallback(
		(ids: string[], reason: string) => {
			if (!reason.trim()) {
				toast.error("Please provide a reason for freezing");
				return;
			}
			const rows = ids.flatMap((id) => {
				const row = effectiveRows.find((r: PendingRow) => r.id === id);
				return row ? [row] : [];
			});
			for (const cmd of buildSendToFreezeCommands(rows, reason, "booking")) {
				applyCommand(cmd);
			}
		},
		[effectiveRows, applyCommand],
	);

	const handleConfirmReorder = async (
		reason: string,
		onComplete: () => void,
	) => {
		if (!reason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		for (const cmd of buildReorderCommands(selectedRows, "booking", reason)) {
			applyCommand(cmd);
		}
		setSelectedRows([]);
		onComplete();
		toast.success(
			`${selectedRows.length} row(s) sent back to Orders (Reorder)`,
		);
	};

	const handleConfirmRebooking = async (
		newDate: string,
		newNote: string,
		status: string | undefined,
		onComplete: () => void,
	) => {
		if (selectedRows.length === 0) return;
		for (const cmd of buildRebookingCommands(
			selectedRows,
			newDate,
			newNote,
			status,
		)) {
			applyCommand(cmd);
		}
		onComplete();
		setSelectedRows([]);
		toast.success(`Rescheduled ${selectedRows.length} booking(s) successfully`);
	};

	const handleConfirmMoveToMain = () => {
		if (selectedRows.length === 0) return;
		const count = selectedRows.length;
		for (const cmd of buildMoveToMainCommands(selectedRows, "booking")) {
			applyCommand(cmd);
		}
		setSelectedRows([]);
		toast.success(`${count} row(s) moved to Main Sheet`);
	};

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			handleUpdateOrder(row.id, { status });
		});
		toast.success(`Updated ${selectedRows.length} item(s) to ${status}`);
	};

	const handleConfirmDelete = async (onComplete: () => void) => {
		const ids = getSelectedIds(selectedRows);
		applyCommand({ type: "deleteRows", ids });
		setSelectedRows([]);
		toast.success("Booking(s) deleted");
		onComplete();
	};

	return {
		handleUpdateOrder,
		handleSendToArchive,
		handleSendToFreeze,
		handleConfirmReorder,
		handleConfirmRebooking,
		handleConfirmMoveToMain,
		handleUpdatePartStatus,
		handleConfirmDelete,
	};
}
