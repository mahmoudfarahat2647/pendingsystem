"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import { releaseAuthorizationCoversRows } from "@/domain/order/releaseGate";
import { useReleaseGate } from "@/hooks/useReleaseGate";
import { useTranslation } from "@/hooks/useTranslation";
import { DRAFT_RECOVERY_MAX_AGE_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { DraftRecoverySnapshotSchema } from "@/schemas/draftSession.schema";
import { orderService } from "@/services/orderService";
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

// Collects VINs authorized for release (issue #242) on any *→call command,
// so their follow-up can be cleared once the move actually persists.
function collectReleaseVins(cmd: DraftCommand, out: Set<string>): void {
	if (cmd.type === "composite") {
		for (const child of cmd.children) collectReleaseVins(child, out);
		return;
	}
	if (
		(cmd.type === "moveRows" || cmd.type === "patchRow") &&
		cmd.destinationStage === "call" &&
		cmd.releaseAuthorization
	) {
		for (const vin of cmd.releaseAuthorization.vins) out.add(vin);
	}
}

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
	const { t } = useTranslation();
	const draftSession = useAppStore((state) => state.draftSession);
	const applyCommand = useAppStore((state) => state.applyCommand);
	const undoDraft = useAppStore((state) => state.undoDraft);
	const redoDraft = useAppStore((state) => state.redoDraft);
	const discardDraft = useAppStore((state) => state.discardDraft);
	const skipFailedCommand = useAppStore((state) => state.skipFailedCommand);
	const restoreFromRecovery = useAppStore((state) => state.restoreFromRecovery);
	const getWorkingRows = useAppStore((state) => state.getWorkingRows);
	const saveDraftInternal = useAppStore((state) => state.saveDraft);
	const lastCommandError = useAppStore((state) => state.lastCommandError);
	const clearCommandError = useAppStore((state) => state.clearCommandError);
	const lastSaveResult = useAppStore((state) => state.lastSaveResult);
	const clearSaveResult = useAppStore((state) => state.clearSaveResult);
	const saveError = useAppStore((state) => state.draftSession.saveError);
	const saveCheckpoint = useAppStore(
		(state) => state.draftSession.saveCheckpoint,
	);

	const saveOrderMutation = useSaveOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation(
		stage ?? "orders",
	);
	const bulkDeleteOrdersMutation = useBulkDeleteOrdersMutation(
		stage ?? "orders",
	);
	const { clearFollowUpsForVins } = useReleaseGate();

	const saveDraft = useCallback(async () => {
		// Mirror the store action's own re-entrancy guard (draftSessionSlice's
		// `saveDraft` no-ops when `dirty === false || saving`) here too. Without
		// this, a redundant/concurrent call that hits that no-op would still
		// fall through to the follow-up-clearing logic below and read
		// `draftSession` state left behind by a real save that is still
		// in-flight (or has since failed) — wrongly treating an unrelated
		// no-op call as a confirmed success. There is no `await` between this
		// check and the store action's own synchronous guard+set, so this is
		// race-free under JS's single-threaded execution.
		const before = useAppStore.getState().draftSession;
		if (before.dirty === false || before.saving) return;

		// Snapshot before saving: a full success clears `pendingCommands`, and a
		// partial failure only tells us how many commands (from the start)
		// actually persisted via `saveCheckpoint.nextIndex`.
		const commandsSnapshot = before.pendingCommands;

		await saveDraftInternal({
			saveOrder: (vars) => saveOrderMutation.mutateAsync(vars),
			bulkUpdateStage: (vars) => bulkUpdateStageMutation.mutateAsync(vars),
			bulkDelete: (ids) => bulkDeleteOrdersMutation.mutateAsync(ids),
			validateCallMove: async ({
				ids,
				sourceStage,
				releaseAuthorization,
				updates,
			}) => {
				const currentRows = await orderService.fetchMappedOrders(sourceStage);
				const idSet = new Set(ids);
				const affectedRows = currentRows
					.filter((row) => idSet.has(row.id))
					.map((row) => ({ ...row, ...updates }));
				if (affectedRows.length !== ids.length) {
					throw new Error(
						"The rows changed before the Call List move could be saved.",
					);
				}
				if (
					!releaseAuthorizationCoversRows(affectedRows, releaseAuthorization)
				) {
					throw new Error(
						"Release authorization became stale. Retry the Call List move and type release again.",
					);
				}
			},
		});

		// Clear the release follow-up only for VINs whose authorized move
		// actually persisted — never merely because it was queued (issue #242:
		// "Do not clear the follow-up merely because a move failed").
		const after = useAppStore.getState().draftSession;
		const persistedCount = after.saveError
			? (after.saveCheckpoint?.nextIndex ?? 0)
			: commandsSnapshot.length;
		if (persistedCount > 0) {
			const releasedVins = new Set<string>();
			for (const cmd of commandsSnapshot.slice(0, persistedCount)) {
				collectReleaseVins(cmd, releasedVins);
			}
			if (releasedVins.size > 0) {
				void clearFollowUpsForVins(Array.from(releasedVins));
			}
		}
	}, [
		bulkDeleteOrdersMutation,
		bulkUpdateStageMutation,
		clearFollowUpsForVins,
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
		// Resolved against the currently active locale at the moment this
		// effect fires, not whatever locale was active when saveDraft() was
		// called — so a save started before a locale switch still reports in
		// the language now active (#268). `t` changes identity on every locale
		// switch (see LocaleProvider), so this effect re-fires... but only
		// when `lastSaveResult` is genuinely still pending; once cleared below
		// it stays `null` and a mere locale switch does not resurface it.
		if (lastSaveResult === "success")
			toast.success(t("toast.draftSaveSuccess"));
		else toast.error(t("toast.draftSaveFailed"));
		clearSaveResult();
	}, [lastSaveResult, clearSaveResult, t]);

	// When saveDraft() stops partway through and is stuck retrying the same
	// failing command (saveCheckpoint is set alongside saveError), offer a way
	// to discard just that one command instead of the whole draft. `saveError`
	// is the operational error text itself and stays untranslated; only the
	// prefix and the action label are localized copy (#268).
	useEffect(() => {
		if (!saveError || !saveCheckpoint) return;
		toast.error(`${t("toast.saveFailedPrefix")} ${saveError}`, {
			id: "draft-save-stuck",
			duration: Number.POSITIVE_INFINITY,
			action: {
				label: t("toast.skipThisChange"),
				onClick: () => {
					skipFailedCommand();
					toast.dismiss("draft-save-stuck");
				},
			},
		});
	}, [saveError, saveCheckpoint, skipFailedCommand, t]);

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
			const parsed = DraftRecoverySnapshotSchema.safeParse(JSON.parse(raw));
			if (!parsed.success) {
				logger.warn(
					"Discarding invalid recovery snapshot:",
					parsed.error.flatten(),
				);
				localStorage.removeItem(RECOVERY_STORAGE_KEY);
				clearRecoveryToastOffer();
				return;
			}
			// The schema intentionally validates structure loosely (row/patch payloads are
			// arbitrary key/value bags); cast to the richer DraftRecoverySnapshot type used
			// by the rest of the draft-session flow.
			const snapshot = parsed.data as DraftRecoverySnapshot;
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
									try {
										restoreFromRecovery(snapshot);
									} catch (error) {
										logger.error("Failed to restore draft snapshot:", error);
										toast.error(
											"Could not restore your unsaved changes — the saved data was invalid.",
										);
									}
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
		skipFailedCommand,
	};
}
