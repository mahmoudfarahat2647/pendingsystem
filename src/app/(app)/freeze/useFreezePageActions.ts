"use client";

import { useCallback } from "react";
import type { useDraftSession } from "@/hooks/useDraftSession";
import type { PendingRow } from "@/types";

export function useFreezePageActions(params: {
	applyCommand: ReturnType<typeof useDraftSession>["applyCommand"];
}) {
	const { applyCommand } = params;

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

	return {
		handleUpdateOrder,
	};
}
