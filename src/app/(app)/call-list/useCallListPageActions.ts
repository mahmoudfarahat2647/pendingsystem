"use client";

import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import { getSelectedIds } from "@/domain/order/orderWorkflow";
import type { useDraftSession } from "@/hooks/useDraftSession";
import { useT } from "@/hooks/useT";
import {
	buildBookingCommands,
	buildMoveToMainCommands,
	buildReorderCommands,
	buildSendToArchiveCommands,
	buildSendToFreezeCommands,
} from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

export function useCallListPageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
	effectiveRows: PendingRow[];
	selectedRows: PendingRow[];
	setSelectedRows: React.Dispatch<React.SetStateAction<PendingRow[]>>;
}) {
	const { applyCommand, effectiveRows, selectedRows, setSelectedRows } = params;
	const { t } = useT();

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "call",
				destinationStage: "call",
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
			for (const cmd of buildSendToArchiveCommands(rows, reason, "call")) {
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
			for (const cmd of buildSendToFreezeCommands(rows, reason, "call")) {
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
			"call",
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
		for (const cmd of buildReorderCommands(selectedRows, "call", reason)) {
			applyCommand(cmd);
		}
		setSelectedRows([]);
		onComplete();
		toast.success(
			`${selectedRows.length} row(s) sent back to Orders (Reorder)`,
		);
	};

	const handleConfirmMoveToMain = () => {
		if (selectedRows.length === 0) return;
		const count = selectedRows.length;
		for (const cmd of buildMoveToMainCommands(selectedRows, "call")) {
			applyCommand(cmd);
		}
		setSelectedRows([]);
		toast.success(t("modals.moveToMain.success", { count }));
	};

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			handleUpdateOrder(row.id, { status });
		});
		toast.success(`Updated ${selectedRows.length} item(s) to ${status}`);
	};

	const handleDelete = (onProceed: () => void) => {
		if (selectedRows.length === 0) {
			toast.error("Please select at least one row");
			return;
		}
		onProceed();
	};

	const handleConfirmDelete = async () => {
		applyCommand({
			type: "deleteRows",
			ids: getSelectedIds(selectedRows),
		});
		setSelectedRows([]);
		toast.success("Row(s) deleted");
	};

	return {
		handleUpdateOrder,
		handleSendToArchive,
		handleSendToFreeze,
		handleConfirmBooking,
		handleConfirmReorder,
		handleConfirmMoveToMain,
		handleUpdatePartStatus,
		handleDelete,
		handleConfirmDelete,
	};
}
