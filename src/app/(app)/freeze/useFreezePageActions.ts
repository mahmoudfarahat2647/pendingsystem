"use client";

import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import type { useDraftSession } from "@/hooks/useDraftSession";
import { buildUnfreezeCommands } from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

export function useFreezePageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
	selectedRows?: PendingRow[];
	setSelectedRows?: React.Dispatch<React.SetStateAction<PendingRow[]>>;
}) {
	const { applyCommand, selectedRows = [], setSelectedRows } = params;

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "freeze",
				destinationStage: "freeze",
				updates,
				previousValues: {},
			});
			return Promise.resolve();
		},
		[applyCommand],
	);

	const handleConfirmUnfreeze = useCallback(
		(destinationStage: OrderStage) => {
			if (selectedRows.length === 0) {
				toast.error("Please select at least one row");
				return;
			}
			for (const cmd of buildUnfreezeCommands(selectedRows, destinationStage)) {
				applyCommand(cmd);
			}
			const count = selectedRows.length;
			setSelectedRows?.([]);
			toast.success(`${count} row(s) moved`);
		},
		[applyCommand, selectedRows, setSelectedRows],
	);

	return {
		handleUpdateOrder,
		handleConfirmUnfreeze,
	};
}
