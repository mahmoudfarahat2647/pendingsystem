"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import { DRAFT_RECOVERY_MAX_AGE_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { getOrdersQueryAdapter } from "@/store/ordersQueryAdapter";
import type {
	DraftCommand,
	DraftRecoverySnapshot,
} from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import { useBulkDeleteOrdersMutation } from "./queries/useBulkDeleteOrdersMutation";
import { useBulkUpdateOrderStageMutation } from "./queries/useBulkUpdateOrderStageMutation";
import { useSaveOrderMutation } from "./queries/useSaveOrderMutation";

const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";
const RECOVERY_MAX_AGE_MS = DRAFT_RECOVERY_MAX_AGE_MS;

// Mirrors getCommandStages/getAllCommandStages from draftSessionSlice (not exported there).
function getSnapshotStages(commands: DraftCommand[]): OrderStage[] {
	const stages = new Set<OrderStage>();
	function collectStages(cmd: DraftCommand): void {
		if (cmd.type === "patchRow") {
			stages.add(cmd.sourceStage);
			stages.add(cmd.destinationStage);
		} else if (cmd.type === "createRows") {
			stages.add(cmd.stage);
		} else if (cmd.type === "deleteRows") {
			// deleteRows could touch any stage; collect all stages already
			// referenced by other commands — the slice uses ORDER_STAGES here,
			// but for the loading guard we only need the stages that are actually
			// referenced in the snapshot, which the other branches cover.
			// Use a conservative fallback: mark no additional stages so we don't
			// block restore when unrelated stages aren't loaded.
		} else if (cmd.type === "moveRows") {
			stages.add(cmd.sourceStage);
			stages.add(cmd.destinationStage);
		} else if (cmd.type === "composite") {
			for (const child of cmd.children) {
				collectStages(child);
			}
		}
	}
	for (const cmd of commands) {
		collectStages(cmd);
	}
	return Array.from(stages);
}

let activeRecoveryToastId: string | number | null = null;
let activeRecoveryToastKey: string | null = null;
// Synchronous lock set before localStorage is read to prevent duplicate recovery
// offers in React Strict Mode (where effects are invoked twice on mount).
let recoveryLockActive = false;

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
	const lastCommandError = useAppStore((state) => state.lastCommandError);
	const clearCommandError = useAppStore((state) => state.clearCommandError);
	const lastSaveResult = useAppStore((state) => state.lastSaveResult);
	const clearSaveResult = useAppStore((state) => state.clearSaveResult);

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
		if (!lastCommandError) return;
		toast.error(lastCommandError);
		clearCommandError();
	}, [lastCommandError, clearCommandError]);

	useEffect(() => {
		if (!lastSaveResult) return;
		if (lastSaveResult === "success")
			toast.success("Draft saved successfully.");
		else toast.error("Draft save failed. Please try again.");
		clearSaveResult();
	}, [lastSaveResult, clearSaveResult]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// Guard against rapid remounts (React Strict Mode, fast navigation) showing
		// the recovery toast twice before the first mount sets activeRecoveryToastKey.
		if (recoveryLockActive) return;
		recoveryLockActive = true;

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
									const stages = getSnapshotStages(snapshot.pendingCommands);
									const adapter = getOrdersQueryAdapter();
									const allLoaded = stages.every((s) =>
										adapter.isStageLoaded(s),
									);
									if (!allLoaded) {
										toast(
											"Your data is still loading — try Restore in a moment.",
											{ duration: 4000 },
										);
										return;
									}
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
			logger.warn("Failed to parse recovery snapshot:", error);
		}

		return () => {
			// Release lock on cleanup so the component can re-evaluate on the next mount.
			recoveryLockActive = false;
		};
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
