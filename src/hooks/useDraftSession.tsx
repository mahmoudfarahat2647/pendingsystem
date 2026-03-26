"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/services/orderService";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import { useBulkDeleteOrdersMutation } from "./queries/useBulkDeleteOrdersMutation";
import { useBulkUpdateOrderStageMutation } from "./queries/useBulkUpdateOrderStageMutation";
import { useSaveOrderMutation } from "./queries/useSaveOrderMutation";

const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";
const RECOVERY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let activeRecoveryToastId: string | number | null = null;
let activeRecoveryToastKey: string | null = null;

function clearRecoveryToastOffer() {
	if (activeRecoveryToastId !== null) {
		toast.dismiss(activeRecoveryToastId);
		activeRecoveryToastId = null;
	}

	activeRecoveryToastKey = null;
}

export function useDraftSession(stage?: OrderStage) {
	const draftSession = useAppStore((state) => state.draftSession);
	const applyCommand = useAppStore((state) => state.applyCommand);
	const undoDraft = useAppStore((state) => state.undoDraft);
	const redoDraft = useAppStore((state) => state.redoDraft);
	const discardDraft = useAppStore((state) => state.discardDraft);
	const restoreFromRecovery = useAppStore((state) => state.restoreFromRecovery);
	const getWorkingRows = useAppStore((state) => state.getWorkingRows);
	const saveDraftInternal = useAppStore((state) => state.saveDraft);

	const saveOrderMutation = useSaveOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation(
		stage ?? "orders",
	);
	const bulkDeleteOrdersMutation = useBulkDeleteOrdersMutation(
		stage ?? "orders",
	);

	const saveDraft = useCallback(() => {
		return saveDraftInternal({
			saveOrder: (vars) => saveOrderMutation.mutateAsync(vars),
			bulkUpdateStage: (vars) => bulkUpdateStageMutation.mutateAsync(vars),
			bulkDelete: (ids) => bulkDeleteOrdersMutation.mutateAsync(ids),
		});
	}, [
		bulkDeleteOrdersMutation,
		bulkUpdateStageMutation,
		saveDraftInternal,
		saveOrderMutation,
	]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
		if (!raw) {
			clearRecoveryToastOffer();
			return;
		}

		try {
			const snapshot: DraftRecoverySnapshot = JSON.parse(raw);
			if (
				snapshot.workspaceId !== draftSession.workspaceId ||
				!snapshot.pendingCommands?.length
			) {
				return;
			}

			if (Date.now() - snapshot.updatedAt > RECOVERY_MAX_AGE_MS) {
				localStorage.removeItem(RECOVERY_STORAGE_KEY);
				clearRecoveryToastOffer();
				return;
			}

			const snapshotKey = [
				snapshot.workspaceId,
				snapshot.updatedAt,
				snapshot.pendingCommands.length,
			].join(":");
			if (activeRecoveryToastKey === snapshotKey) {
				return;
			}

			clearRecoveryToastOffer();
			activeRecoveryToastKey = snapshotKey;
			activeRecoveryToastId = toast.custom(
				(t) => (
					<div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
						<p className="text-sm text-white">
							You have{" "}
							<strong>{snapshot.pendingCommands.length} unsaved changes</strong>{" "}
							from your last session.
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => {
									clearRecoveryToastOffer();
									restoreFromRecovery(snapshot);
									toast.dismiss(t);
								}}
								className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
							>
								Restore
							</button>
							<button
								type="button"
								onClick={() => {
									clearRecoveryToastOffer();
									discardDraft();
									toast.dismiss(t);
								}}
								className="rounded bg-slate-700 px-3 py-1 text-sm text-white transition-colors hover:bg-slate-600"
							>
								Discard
							</button>
						</div>
					</div>
				),
				{ duration: Infinity },
			);
		} catch (error) {
			clearRecoveryToastOffer();
			console.warn("Failed to parse recovery snapshot:", error);
		}
	}, [draftSession.workspaceId, discardDraft, restoreFromRecovery]);

	const workingRows = useMemo(
		() => (stage ? getWorkingRows(stage) : undefined),
		[stage, getWorkingRows, draftSession.pendingCommands.length],
	);

	return {
		isActive: draftSession.isActive,
		dirty: draftSession.dirty,
		saving: draftSession.saving,
		saveError: draftSession.saveError,
		canUndo: !draftSession.saving && draftSession.past.length > 0,
		canRedo: !draftSession.saving && draftSession.future.length > 0,
		pendingCommandCount: draftSession.pendingCommands.length,
		workingRows,
		applyCommand,
		undoDraft,
		redoDraft,
		saveDraft,
		discardDraft,
	};
}
