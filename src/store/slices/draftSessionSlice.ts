import type { StateCreator } from "zustand";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	computeReleaseFingerprint,
	getQualifyingChassis,
	releaseAuthorizationCoversRows,
} from "@/domain/order/releaseGate";
import { hasAttachment } from "@/lib/attachment";
import { ORDER_STAGES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { BeastModeSchema } from "@/schemas/form.schema";
import type { PendingRow } from "@/types";
import { getOrdersQueryAdapter } from "../ordersQueryAdapter";
import type {
	CombinedStore,
	DraftSessionActions,
	DraftSessionState,
} from "../types";

// Constants
const COMMAND_LIMIT = 30;
const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";
const WORKSPACE_ID_KEY = "pending-sys-workspace-id";

export type {
	AtomicCommand,
	CreateRowsCommand,
	DeleteRowsCommand,
	DraftCommand,
	DraftRecoverySnapshot,
	DraftSaveMutations,
	DraftSession,
	MoveRowsCommand,
} from "./draftSessionCommands";

import type {
	AtomicCommand,
	DraftCommand,
	DraftRecoverySnapshot,
	DraftSaveMutations,
	DraftSession,
} from "./draftSessionCommands";

export type { DraftSessionActions, DraftSessionState } from "../types";

// --- Helpers ---

function getOrCreateWorkspaceId(): string {
	if (typeof window === "undefined") return "server";
	const existing = localStorage.getItem(WORKSPACE_ID_KEY);
	if (existing) return existing;
	const id = crypto.randomUUID();
	localStorage.setItem(WORKSPACE_ID_KEY, id);
	return id;
}

function deepCloneByStage(baselineByStage: Record<OrderStage, PendingRow[]>) {
	const cloned: Record<OrderStage, PendingRow[]> = {} as Record<
		OrderStage,
		PendingRow[]
	>;
	for (const stage of ORDER_STAGES) {
		cloned[stage] = structuredClone(baselineByStage[stage] ?? []);
	}
	return cloned;
}

// Module-level memoization cache for _deriveWorkingRows
let _derivedRowsCache: {
	version: string;
	rows: Record<OrderStage, PendingRow[]>;
} | null = null;

let _nextDerivedRowsRevision = 1;

function allocateDerivedRowsRevision(): number {
	return _nextDerivedRowsRevision++;
}

// --- Slice ---

export const createDraftSessionSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	DraftSessionState & DraftSessionActions
> = (set, get) => {
	const initialSession: DraftSession = {
		isActive: false,
		baselineByStage: {
			orders: [],
			main: [],
			call: [],
			booking: [],
			archive: [],
			freeze: [],
		},
		derivedRowsRevision: 0,
		pendingCommands: [],
		past: [],
		future: [],
		dirty: false,
		saving: false,
		saveError: null,
		touchedStages: new Set(),
		lastTouchedAt: null,
		workspaceId: getOrCreateWorkspaceId(),
		saveCheckpoint: null,
		saveBlockedIndex: null,
	};

	return {
		draftSession: initialSession,
		lastSaveResult: null,
		lastCommandError: null,

		_captureBaseline: () => {
			const baseline: Record<OrderStage, PendingRow[]> = {} as Record<
				OrderStage,
				PendingRow[]
			>;
			const adapter = getOrdersQueryAdapter();
			for (const stage of ORDER_STAGES) {
				baseline[stage] = adapter.getStageRows(stage) ?? [];
			}
			set((state) => ({
				draftSession: {
					...state.draftSession,
					baselineByStage: baseline,
					derivedRowsRevision: allocateDerivedRowsRevision(),
					isActive: true,
				},
			}));
		},

		_deriveWorkingRows: () => {
			const state = get().draftSession;
			if (!state.isActive || state.pendingCommands.length === 0) {
				for (const stage of ORDER_STAGES) {
					if (!state.baselineByStage[stage]) {
						state.baselineByStage[stage] = [];
					}
				}
				return state.baselineByStage;
			}

			const version = `${state.workspaceId}|${state.derivedRowsRevision}`;
			if (_derivedRowsCache?.version === version) {
				return _derivedRowsCache.rows;
			}

			const working = deepCloneByStage(state.baselineByStage);

			const applyCommandToWorking = (
				cmd: DraftCommand,
				working: Record<OrderStage, PendingRow[]>,
			) => {
				if (cmd.type === "patchRow") {
					const sourceRows = working[cmd.sourceStage];
					const destinationRows = working[cmd.destinationStage];
					const sourceIndex = sourceRows.findIndex((r) => r.id === cmd.id);
					const destinationIndex = destinationRows.findIndex(
						(r) => r.id === cmd.id,
					);
					const existingRow =
						(destinationIndex >= 0
							? destinationRows[destinationIndex]
							: undefined) ??
						(sourceIndex >= 0 ? sourceRows[sourceIndex] : undefined);

					if (!existingRow) {
						return;
					}

					const updatedRow = {
						...existingRow,
						...cmd.updates,
						stage: cmd.destinationStage,
					};

					if (cmd.sourceStage !== cmd.destinationStage) {
						if (sourceIndex >= 0) {
							sourceRows.splice(sourceIndex, 1);
						}

						if (destinationIndex >= 0) {
							destinationRows[destinationIndex] = updatedRow;
						} else {
							destinationRows.push(updatedRow);
						}

						return;
					}

					if (destinationIndex >= 0) {
						destinationRows[destinationIndex] = updatedRow;
					}
				} else if (cmd.type === "createRows") {
					working[cmd.stage].push(...structuredClone(cmd.rows));
				} else if (cmd.type === "deleteRows") {
					const idSet = new Set(cmd.ids);
					for (const stage of ORDER_STAGES) {
						working[stage] = working[stage].filter((r) => !idSet.has(r.id));
					}
				} else if (cmd.type === "moveRows") {
					const idSet = new Set(cmd.ids);
					const moved = working[cmd.sourceStage].filter((r) => idSet.has(r.id));
					working[cmd.sourceStage] = working[cmd.sourceStage].filter(
						(r) => !idSet.has(r.id),
					);
					for (const row of moved) {
						const updated = {
							...row,
							stage: cmd.destinationStage,
							...cmd.fieldOverrides,
						};
						working[cmd.destinationStage].push(updated);
					}
				} else if (cmd.type === "composite") {
					for (const child of cmd.children) {
						applyCommandToWorking(child, working);
					}
				} else {
					const unknownType = (cmd as { type?: unknown }).type;
					logger.error(
						"Unknown draft command type in applyCommandToWorking",
						unknownType,
					);
					throw new Error(`Unknown draft command type: ${String(unknownType)}`);
				}
			};

			for (const cmd of state.pendingCommands) {
				applyCommandToWorking(cmd, working);
			}

			_derivedRowsCache = { version, rows: working };
			return working;
		},

		_persistRecovery: () => {
			if (typeof window === "undefined") return;
			const state = get().draftSession;
			if (state.pendingCommands.length === 0) {
				localStorage.removeItem(RECOVERY_STORAGE_KEY);
				return;
			}
			const snapshot: DraftRecoverySnapshot = {
				workspaceId: state.workspaceId,
				updatedAt: Date.now(),
				pendingCommands: state.pendingCommands,
			};
			localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(snapshot));
		},

		_clearRecovery: () => {
			if (typeof window === "undefined") return;
			localStorage.removeItem(RECOVERY_STORAGE_KEY);
		},

		applyCommand: (cmd: DraftCommand): boolean => {
			const state = get();

			// Lazy baseline capture
			if (!state.draftSession.isActive) {
				get()._captureBaseline();
			}

			// Beast Mode guard for moveRows orders→main
			if (
				cmd.type === "moveRows" &&
				cmd.destinationStage === "main" &&
				cmd.sourceStage === "orders"
			) {
				const workingRows = get()._deriveWorkingRows();
				const affectedRows = workingRows.orders.filter((r) =>
					cmd.ids.includes(r.id),
				);

				for (const row of affectedRows) {
					// Run Beast Mode validation
					const result = BeastModeSchema.safeParse(row);
					if (!result.success) {
						get().triggerBeastMode(row.id, Date.now());
						set(() => ({
							lastCommandError: `Missing required fields for: ${row.trackingId || row.id}`,
						}));
						return false;
					}

					// Also validate partNumber, description, attachment
					if (!row.partNumber || !row.description) {
						set(() => ({
							lastCommandError: `Part number and description required for: ${row.trackingId || row.id}`,
						}));
						return false;
					}

					if (!hasAttachment(row)) {
						set(() => ({
							lastCommandError: `Attachment required for: ${row.trackingId || row.id}`,
						}));
						return false;
					}
				}
			}

			// Freeze guard for patchRow *→freeze transitions: a freeze without a
			// reason is rejected here at the command layer, independent of the
			// reason modal. Same-stage freeze writes (note/attachment edits on
			// already-frozen rows) pass through untouched.
			if (
				cmd.type === "patchRow" &&
				cmd.destinationStage === "freeze" &&
				cmd.sourceStage !== "freeze"
			) {
				const reason =
					typeof cmd.updates.freezeReason === "string"
						? cmd.updates.freezeReason
						: "";
				if (!reason.trim()) {
					set(() => ({
						lastCommandError: "A reason is required to freeze rows.",
					}));
					return false;
				}
			}

			// Release-gate guard for any *→call transition (issue #242): defense
			// in depth behind the producer-side gate. A command carrying no rows
			// that require release, or one whose releaseAuthorization fingerprint
			// matches the exact affected rows, is allowed through unchanged.
			if (
				(cmd.type === "moveRows" || cmd.type === "patchRow") &&
				cmd.destinationStage === "call" &&
				cmd.sourceStage !== "call"
			) {
				const workingRows = get()._deriveWorkingRows();
				const affectedIds = cmd.type === "moveRows" ? cmd.ids : [cmd.id];
				const affectedRows = ORDER_STAGES.flatMap(
					(stage) => workingRows[stage] ?? [],
				).filter((row) => affectedIds.includes(row.id));

				const qualifying = getQualifyingChassis(affectedRows);
				if (qualifying.length > 0) {
					const fingerprint = computeReleaseFingerprint(affectedRows);
					const auth = cmd.releaseAuthorization;
					const authorizedVins = new Set(auth?.vins ?? []);
					const covered =
						auth != null &&
						auth.fingerprint === fingerprint &&
						qualifying.every((chassis) => authorizedVins.has(chassis.vin));
					if (!covered) {
						set(() => ({
							lastCommandError:
								"Release confirmation is required before moving this warranty chassis to Call List.",
						}));
						return false;
					}
				}
			}

			set((state) => {
				const newSession: DraftSession = {
					...state.draftSession,
					pendingCommands: [...state.draftSession.pendingCommands, cmd],
					past: [...state.draftSession.past, cmd].slice(-COMMAND_LIMIT),
					future: [],
					dirty: true,
					touchedStages: new Set([
						...state.draftSession.touchedStages,
						...getCommandStages(cmd),
					]),
					derivedRowsRevision: allocateDerivedRowsRevision(),
					lastTouchedAt: Date.now(),
				};
				return { draftSession: newSession };
			});

			get()._persistRecovery();
			return true;
		},

		undoDraft: () => {
			const state = get().draftSession;
			if (state.saving || state.past.length === 0) return;

			const cmd = state.past[state.past.length - 1];

			set((state) => ({
				draftSession: {
					...state.draftSession,
					pendingCommands: state.draftSession.pendingCommands.slice(0, -1),
					past: state.draftSession.past.slice(0, -1),
					future: [...state.draftSession.future, cmd],
					derivedRowsRevision: allocateDerivedRowsRevision(),
					dirty: state.draftSession.pendingCommands.length > 1,
					saveCheckpoint: null,
					saveBlockedIndex: null,
				},
			}));

			get()._persistRecovery();
		},

		redoDraft: () => {
			const state = get().draftSession;
			if (state.saving || state.future.length === 0) return;

			const cmd = state.future[state.future.length - 1];

			set((state) => ({
				draftSession: {
					...state.draftSession,
					pendingCommands: [...state.draftSession.pendingCommands, cmd],
					past: [...state.draftSession.past, cmd],
					future: state.draftSession.future.slice(0, -1),
					derivedRowsRevision: allocateDerivedRowsRevision(),
					dirty: true,
					saveCheckpoint: null,
					saveBlockedIndex: null,
				},
			}));

			get()._persistRecovery();
		},

		// Conflict handling policy for concurrent stage changes & recovery snapshots (Issue #202):
		// When saving commands (from either a live session or a restored recovery snapshot)
		// targeting a row that has since been frozen or moved elsewhere by another client,
		// the policy is "surfaced for manual reconciliation" (rather than blanket rejection
		// of the entire snapshot or silent dropping of the conflicting edit).
		// Execution halts at the failing command index via saveCheckpoint, leaving all
		// uncommitted commands intact. The user is presented with a clear, freeze-specific
		// error message and can either skip just the conflicting command via skipFailedCommand()
		// or discard the entire draft session via discardDraft().
		saveDraft: async (mutations) => {
			const state = get().draftSession;
			if (state.dirty === false || state.saving) return;

			set((state) => ({
				draftSession: {
					...state.draftSession,
					saving: true,
					saveError: null,
					saveBlockedIndex: null,
				},
			}));

			const savedCheckpoint = state.saveCheckpoint;
			const idMap = new Map<string, string>(
				savedCheckpoint?.idMapEntries ?? [],
			);
			const startIndex = savedCheckpoint?.nextIndex ?? 0;
			let currentIndex = startIndex;
			let preflightFailedIndex: number | null = null;

			try {
				// Re-check every not-yet-persisted Call move against the draft's
				// final working values. This catches edits made after the user typed
				// `release` but before Save was pressed.
				const finalRowsById = new Map(
					ORDER_STAGES.flatMap(
						(stage) => get()._deriveWorkingRows()[stage] ?? [],
					).map((row) => [row.id, row]),
				);
				for (let i = startIndex; i < state.pendingCommands.length; i++) {
					if (
						!commandHasCurrentReleaseAuthorization(
							state.pendingCommands[i],
							finalRowsById,
						)
					) {
						preflightFailedIndex = i;
						throw new Error(
							"Release authorization became stale before save. Retry the Call List move and type release again.",
						);
					}
				}

				// Execute all pending commands in order, tracking temp→real ID mappings
				// so that post-create commands (delete/move/patch) target the right Supabase rows.
				// On retry after partial failure, restore idMap and skip already-executed commands.
				for (let i = startIndex; i < state.pendingCommands.length; i++) {
					currentIndex = i;
					await executeCommand(state.pendingCommands[i], mutations, idMap);
					set((s) => ({
						draftSession: {
							...s.draftSession,
							saveCheckpoint: {
								nextIndex: i + 1,
								idMapEntries: [...idMap.entries()],
							},
						},
					}));
				}

				// On success: clear session
				set((state) => ({
					draftSession: {
						...initialSession,
						derivedRowsRevision: allocateDerivedRowsRevision(),
						workspaceId: state.draftSession.workspaceId,
					},
				}));

				// Invalidate touched stages
				const prevSession = state;
				const adapter = getOrdersQueryAdapter();
				for (const stage of prevSession.touchedStages) {
					adapter.invalidateStage(stage);
				}

				get()._clearRecovery();
			} catch (error) {
				const message = error instanceof Error ? error.message : "Save failed";
				const isPreflightFailure = preflightFailedIndex !== null;
				const blockedIndex = isPreflightFailure
					? preflightFailedIndex
					: currentIndex;

				set((state) => {
					const checkpoint = isPreflightFailure
						? (state.draftSession.saveCheckpoint ?? {
								nextIndex: startIndex,
								idMapEntries: [...idMap.entries()],
							})
						: (state.draftSession.saveCheckpoint ?? {
								nextIndex: currentIndex,
								idMapEntries: [...idMap.entries()],
							});

					return {
						draftSession: {
							...state.draftSession,
							saving: false,
							saveError: message,
							saveCheckpoint: checkpoint,
							saveBlockedIndex: blockedIndex,
						},
					};
				});
				// Keep all draft state intact for retry
			}
		},

		// Removes only the single pending command that saveDraft() is currently stuck on
		// (the one at saveBlockedIndex, falling back to saveCheckpoint.nextIndex — e.g. a
		// command with a permanent validation error or stale preflight check that will never
		// succeed on retry), leaving the rest of the draft (past, future, and every other
		// pending command) untouched. Use discardDraft() instead if the whole draft should
		// be thrown away.
		skipFailedCommand: () => {
			const state = get().draftSession;
			const checkpoint = state.saveCheckpoint;
			if (!checkpoint) {
				logger.warn(
					"skipFailedCommand called with no active saveCheckpoint; ignoring.",
				);
				return;
			}

			const targetIndex = state.saveBlockedIndex ?? checkpoint.nextIndex;
			if (targetIndex < 0 || targetIndex >= state.pendingCommands.length) {
				logger.warn(
					"skipFailedCommand: saveCheckpoint.nextIndex is out of range; ignoring.",
				);
				return;
			}

			set((state) => {
				const pendingCommands = [
					...state.draftSession.pendingCommands.slice(0, targetIndex),
					...state.draftSession.pendingCommands.slice(targetIndex + 1),
				];

				let nextCheckpoint: typeof checkpoint | null;
				if (targetIndex > checkpoint.nextIndex) {
					nextCheckpoint =
						checkpoint.nextIndex === 0 && checkpoint.idMapEntries.length === 0
							? null
							: {
									nextIndex: checkpoint.nextIndex,
									idMapEntries: checkpoint.idMapEntries,
								};
				} else {
					const hasRemaining = targetIndex < pendingCommands.length;
					nextCheckpoint = hasRemaining
						? {
								nextIndex: targetIndex,
								idMapEntries: checkpoint.idMapEntries,
							}
						: null;
				}

				return {
					draftSession: {
						...state.draftSession,
						pendingCommands,
						dirty: pendingCommands.length > 0,
						saving: false,
						saveError: null,
						derivedRowsRevision: allocateDerivedRowsRevision(),
						saveCheckpoint: nextCheckpoint,
						saveBlockedIndex: null,
					},
				};
			});

			get()._persistRecovery();
		},

		discardDraft: () => {
			const state = get().draftSession;

			// Invalidate touched stages
			const adapter = getOrdersQueryAdapter();
			for (const stage of state.touchedStages) {
				adapter.invalidateStage(stage);
			}

			set((state) => ({
				draftSession: {
					...initialSession,
					derivedRowsRevision: allocateDerivedRowsRevision(),
					workspaceId: state.draftSession.workspaceId,
				},
			}));

			get()._clearRecovery();
		},

		// Restores a recovery snapshot into working state. If any restored commands
		// target rows that have since been frozen or moved concurrently, the conflict
		// will be surfaced at saveDraft() time for per-row reconciliation (skip or discard).
		restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => {
			// Capture fresh baseline from current RQ caches
			get()._captureBaseline();

			const newSession = get().draftSession;
			for (const stage of ORDER_STAGES) {
				if (!newSession.baselineByStage[stage]) {
					newSession.baselineByStage[stage] = [];
				}
			}

			// A restored recovery snapshot replays straight into saveDraft
			// without re-entering applyCommand, so any *→call command must be
			// re-verified here (issue #242 §4): drop it if the affected rows'
			// VIN/warranty/mileage changed since the release was authorized,
			// rather than silently replaying a stale release.
			const freshBaselineRows = ORDER_STAGES.flatMap(
				(stage) => newSession.baselineByStage[stage] ?? [],
			);
			const byId = new Map(freshBaselineRows.map((row) => [row.id, row]));
			let droppedStaleRelease = false;

			function isStaleCallCommand(cmd: DraftCommand): boolean {
				if (
					(cmd.type !== "moveRows" && cmd.type !== "patchRow") ||
					cmd.destinationStage !== "call" ||
					cmd.sourceStage === "call"
				) {
					return false;
				}
				const affectedIds = cmd.type === "moveRows" ? cmd.ids : [cmd.id];
				const freshRows = affectedIds
					.map((id) => byId.get(id))
					.filter((row): row is PendingRow => row !== undefined);
				const qualifying = getQualifyingChassis(freshRows);
				if (qualifying.length === 0) return false;

				const fingerprint = computeReleaseFingerprint(freshRows);
				const auth = cmd.releaseAuthorization;
				const authorizedVins = new Set(auth?.vins ?? []);
				const covered =
					auth != null &&
					auth.fingerprint === fingerprint &&
					qualifying.every((chassis) => authorizedVins.has(chassis.vin));
				return !covered;
			}

			const filteredCommands = snapshot.pendingCommands.filter((cmd) => {
				if (isStaleCallCommand(cmd)) {
					droppedStaleRelease = true;
					return false;
				}
				return true;
			});

			if (droppedStaleRelease) {
				logger.warn(
					"[draftSession] Dropped a stale release-authorized move to Call List while restoring a recovery snapshot — the affected chassis changed since release was confirmed.",
				);
			}

			set(() => ({
				draftSession: {
					...newSession,
					derivedRowsRevision: allocateDerivedRowsRevision(),
					pendingCommands: filteredCommands,
					past: [],
					future: [],
					dirty: filteredCommands.length > 0,
					touchedStages: new Set(getAllCommandStages(filteredCommands)),
					lastTouchedAt: snapshot.updatedAt,
				},
				lastCommandError: droppedStaleRelease
					? "A pending Call List move required a fresh release confirmation and was not restored."
					: null,
			}));
		},

		getWorkingRows: (stage: OrderStage) => {
			const state = get().draftSession;
			if (!state.isActive || state.pendingCommands.length === 0) {
				return getOrdersQueryAdapter().getStageRows(stage);
			}
			return get()._deriveWorkingRows()[stage] ?? [];
		},

		clearSaveResult: () => {
			set(() => ({ lastSaveResult: null }));
		},

		clearCommandError: () => {
			set(() => ({ lastCommandError: null }));
		},
	};
};

// --- Helpers ---

function getCommandStages(cmd: DraftCommand): OrderStage[] {
	if (cmd.type === "patchRow") {
		const stages = new Set<OrderStage>([cmd.sourceStage, cmd.destinationStage]);
		return Array.from(stages);
	} else if (cmd.type === "createRows") {
		return [cmd.stage];
	} else if (cmd.type === "deleteRows") {
		return ORDER_STAGES; // Could be in any stage
	} else if (cmd.type === "moveRows") {
		return [cmd.sourceStage, cmd.destinationStage];
	} else if (cmd.type === "composite") {
		const stages = new Set<OrderStage>();
		for (const child of cmd.children) {
			for (const stage of getCommandStages(child)) {
				stages.add(stage);
			}
		}
		return Array.from(stages);
	}
	const unknownType = (cmd as { type?: unknown }).type;
	logger.error("Unknown draft command type in getCommandStages", unknownType);
	throw new Error(`Unknown draft command type: ${String(unknownType)}`);
}

function getAllCommandStages(commands: DraftCommand[]): OrderStage[] {
	const stages = new Set<OrderStage>();
	for (const cmd of commands) {
		for (const stage of getCommandStages(cmd)) {
			stages.add(stage);
		}
	}
	return Array.from(stages);
}

function isTempId(id: string): boolean {
	return id.startsWith("temp-");
}

function remapCommand(
	cmd: AtomicCommand,
	idMap: Map<string, string>,
): AtomicCommand {
	if (idMap.size === 0) return cmd;
	const remap = (id: string) => idMap.get(id) ?? id;

	switch (cmd.type) {
		case "patchRow":
			return { ...cmd, id: remap(cmd.id) };
		case "createRows":
			// id:"" is passed to saveOrder for INSERT — no remap needed here
			return cmd;
		case "deleteRows":
			return { ...cmd, ids: cmd.ids.map(remap) };
		case "moveRows":
			return { ...cmd, ids: cmd.ids.map(remap) };
	}
}

async function executeCommand(
	cmd: DraftCommand,
	mutations: DraftSaveMutations,
	idMap: Map<string, string>,
): Promise<void> {
	if (cmd.type === "composite") {
		// Do NOT remap at the composite level — each child remaps individually
		// so that createRows children can populate idMap before sibling
		// deleteRows/moveRows children are remapped.
		const nonDeletes = cmd.children.filter((c) => c.type !== "deleteRows");
		const deletes = cmd.children.filter((c) => c.type === "deleteRows");

		for (const child of nonDeletes) {
			await executeCommand(child, mutations, idMap);
		}
		await Promise.all(
			deletes.map((child) => executeCommand(child, mutations, idMap)),
		);
		return;
	}

	const remapped = remapCommand(cmd, idMap);
	if (
		(remapped.type === "patchRow" || remapped.type === "moveRows") &&
		remapped.destinationStage === "call" &&
		remapped.sourceStage !== "call"
	) {
		await mutations.validateCallMove?.({
			ids: remapped.type === "moveRows" ? remapped.ids : [remapped.id],
			sourceStage: remapped.sourceStage,
			releaseAuthorization: remapped.releaseAuthorization,
			updates:
				remapped.type === "patchRow"
					? remapped.updates
					: remapped.fieldOverrides,
		});
	}

	if (remapped.type === "patchRow") {
		await mutations.saveOrder({
			id: remapped.id,
			updates: remapped.updates,
			stage: remapped.destinationStage,
			sourceStage: remapped.sourceStage,
		});
	} else if (remapped.type === "createRows") {
		for (const row of remapped.rows) {
			const result = await mutations.saveOrder({
				id: "",
				updates: row,
				stage: remapped.stage,
				idempotencyKey: isTempId(row.id) ? row.id : undefined,
			});
			// Capture temp→real ID so subsequent commands can reference this row
			const realId = (result as Record<string, unknown>)?.id;
			if (typeof realId === "string" && realId && isTempId(row.id)) {
				idMap.set(row.id, realId);
			}
		}
	} else if (remapped.type === "deleteRows") {
		await mutations.bulkDelete(remapped.ids);
	} else if (remapped.type === "moveRows") {
		await mutations.bulkUpdateStage({
			ids: remapped.ids,
			stage: remapped.destinationStage,
			sourceStage: remapped.sourceStage,
			guardFrozenVins: remapped.guardFrozenVins,
		});
	} else {
		const unknownType = (remapped as { type?: unknown }).type;
		logger.error("Unknown draft command type in executeCommand", unknownType);
		throw new Error(`Unknown draft command type: ${String(unknownType)}`);
	}
}

function commandHasCurrentReleaseAuthorization(
	cmd: DraftCommand,
	rowsById: Map<string, PendingRow>,
): boolean {
	if (cmd.type === "composite") {
		return cmd.children.every((child) =>
			commandHasCurrentReleaseAuthorization(child, rowsById),
		);
	}
	if (
		(cmd.type !== "moveRows" && cmd.type !== "patchRow") ||
		cmd.destinationStage !== "call" ||
		cmd.sourceStage === "call"
	) {
		return true;
	}

	const ids = cmd.type === "moveRows" ? cmd.ids : [cmd.id];
	const rows = ids
		.map((id) => rowsById.get(id))
		.filter((row): row is PendingRow => row !== undefined);
	if (rows.length !== ids.length) return false;
	return releaseAuthorizationCoversRows(rows, cmd.releaseAuthorization);
}
