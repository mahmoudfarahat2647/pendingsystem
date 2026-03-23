"use client";

import { useEffect, useCallback, useMemo } from "react";
import type { OrderStage } from "@/services/orderService";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import { useSaveOrderMutation } from "./queries/useSaveOrderMutation";
import { useBulkUpdateOrderStageMutation } from "./queries/useBulkUpdateOrderStageMutation";
import { useBulkDeleteOrdersMutation } from "./queries/useBulkDeleteOrdersMutation";
import { toast } from "sonner";

const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";
const WORKSPACE_ID_KEY = "pending-sys-workspace-id";

export function useDraftSession(stage?: OrderStage) {
	// Slice state
	const draftSession = useAppStore((s) => s.draftSession);
	const applyCommand = useAppStore((s) => s.applyCommand);
	const undoDraft = useAppStore((s) => s.undoDraft);
	const redoDraft = useAppStore((s) => s.redoDraft);
	const discardDraft = useAppStore((s) => s.discardDraft);
	const restoreFromRecovery = useAppStore((s) => s.restoreFromRecovery);
	const getWorkingRows = useAppStore((s) => s.getWorkingRows);
	const saveDraftInternal = useAppStore((s) => s.saveDraft);

	// Mutation hooks
	const saveOrderMutation = useSaveOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation(stage ?? "orders");
	const bulkDeleteOrdersMutation = useBulkDeleteOrdersMutation(stage ?? "orders");

	// Bind mutations at call time
	const saveDraft = useCallback(() => {
		return saveDraftInternal({
			saveOrder: (vars) => saveOrderMutation.mutateAsync(vars),
			bulkUpdateStage: (vars) => bulkUpdateStageMutation.mutateAsync(vars),
			bulkDelete: (ids) => bulkDeleteOrdersMutation.mutateAsync(ids),
		});
	}, [saveDraftInternal, saveOrderMutation, bulkUpdateStageMutation, bulkDeleteOrdersMutation]);

	// Recovery check on mount (moved to app initialization for better startup perf)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
		if (!raw) return;

		try {
			const snapshot: DraftRecoverySnapshot = JSON.parse(raw);
			// Check workspace match and command existence before age/restore logic
			if (snapshot.workspaceId !== draftSession.workspaceId || !snapshot.pendingCommands?.length) {
				return;
			}

			// Check age: if >7 days, silently discard
			const ageMs = Date.now() - snapshot.updatedAt;
			const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
			if (ageMs > sevenDaysMs) {
				localStorage.removeItem(RECOVERY_STORAGE_KEY);
				return;
			}

			// Surface recovery offer as non-blocking toast
			toast.custom((t) => (
				<div className="flex flex-col gap-3 p-4 bg-slate-900 border border-slate-700 rounded-lg">
					<p className="text-sm text-white">
						You have <strong>{snapshot.pendingCommands.length} unsaved changes</strong> from your last session.
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => {
								restoreFromRecovery(snapshot);
								toast.dismiss(t);
							}}
							className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
						>
							Restore
						</button>
						<button
							onClick={() => {
								discardDraft();
								toast.dismiss(t);
							}}
							className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
						>
							Discard
						</button>
					</div>
				</div>
			), { duration: Infinity });
		} catch (e) {
			// Malformed recovery data
			console.warn("Failed to parse recovery snapshot:", e);
		}
	}, [draftSession.workspaceId, restoreFromRecovery, discardDraft]);

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
