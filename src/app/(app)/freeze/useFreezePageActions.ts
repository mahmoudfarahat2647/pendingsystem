"use client";

import type React from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	buildReleaseAuthorization,
	getQualifyingChassis,
} from "@/domain/order/releaseGate";
import type { useDraftSession } from "@/hooks/useDraftSession";
import { useReleaseGate } from "@/hooks/useReleaseGate";
import { buildUnfreezeCommands } from "@/lib/orderStageTransitions";
import type { PendingRow } from "@/types";

export function useFreezePageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
	selectedRows?: PendingRow[];
	setSelectedRows?: React.Dispatch<React.SetStateAction<PendingRow[]>>;
}) {
	const { applyCommand, selectedRows = [], setSelectedRows } = params;
	const { requestCallRelease } = useReleaseGate();

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
		async (destinationStage: OrderStage) => {
			if (selectedRows.length === 0) {
				toast.error("Please select at least one row");
				return;
			}

			let rowsToMove = selectedRows;
			let cancelledCount = 0;

			if (destinationStage === "call") {
				const gateResult = await requestCallRelease({
					rows: selectedRows,
					automatic: false,
				});
				rowsToMove = gateResult.approvedRows;
				cancelledCount = gateResult.cancelledVins.length;
				if (rowsToMove.length === 0) {
					if (cancelledCount > 0) {
						toast.error("Release not confirmed — no rows were moved.");
					}
					return;
				}
			}

			for (const cmd of buildUnfreezeCommands(rowsToMove, destinationStage)) {
				if (destinationStage === "call") {
					const row = rowsToMove.find((r) => r.id === cmd.id);
					const qualifying = row ? getQualifyingChassis([row]) : [];
					if (qualifying.length > 0 && row) {
						applyCommand({
							...cmd,
							releaseAuthorization: buildReleaseAuthorization(
								[row],
								qualifying.map((c) => c.vin),
							),
						});
						continue;
					}
				}
				applyCommand(cmd);
			}
			const count = rowsToMove.length;
			setSelectedRows?.([]);
			if (cancelledCount > 0) {
				toast.success(
					`${count} row(s) moved (${cancelledCount} chassis withheld pending release approval)`,
				);
			} else {
				toast.success(`${count} row(s) moved`);
			}
		},
		[applyCommand, requestCallRelease, selectedRows, setSelectedRows],
	);

	return {
		handleUpdateOrder,
		handleConfirmUnfreeze,
	};
}
