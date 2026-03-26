import { toast } from "sonner";
import type { StateCreator } from "zustand";
import {
	getOrdersQueryKey,
	ORDER_STAGES,
	queryClient,
} from "@/lib/queryClient";
import { BeastModeSchema } from "@/schemas/form.schema";
import type { OrderStage } from "@/services/orderService";
import type { PendingRow } from "@/types";
import type { CombinedStore } from "../types";
import { useAppStore } from "../useStore";

// Constants
const COMMAND_LIMIT = 30;
const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";
const WORKSPACE_ID_KEY = "pending-sys-workspace-id";

// --- Command Types ---

export interface PatchRowCommand {
	type: "patchRow";
	id: string;
	sourceStage: OrderStage;
	destinationStage: OrderStage;
	updates: Partial<PendingRow>;
	previousValues: Partial<PendingRow>;
}

export interface CreateRowsCommand {
	type: "createRows";
	stage: OrderStage;
	rows: PendingRow[];
}

export interface DeleteRowsCommand {
	type: "deleteRows";
	ids: string[];
}

export interface MoveRowsCommand {
	type: "moveRows";
	ids: string[];
	sourceStage: OrderStage;
	destinationStage: OrderStage;
	fieldOverrides?: Partial<PendingRow>;
}

export interface CompositeCommand {
	type: "composite";
	label: string;
	children: (
		| PatchRowCommand
		| CreateRowsCommand
		| DeleteRowsCommand
		| MoveRowsCommand
	)[];
}

export type AtomicCommand =
	| PatchRowCommand
	| CreateRowsCommand
	| DeleteRowsCommand
	| MoveRowsCommand;

export type DraftCommand = AtomicCommand | CompositeCommand;

export interface SaveOrderDraftMutationVars {
	id: string;
	updates: Partial<PendingRow>;
	stage: OrderStage;
	sourceStage?: OrderStage;
}

export interface BulkUpdateStageDraftMutationVars {
	ids: string[];
	stage: OrderStage;
	silentErrorToast?: boolean;
}

export interface DraftSaveMutations {
	saveOrder: (vars: SaveOrderDraftMutationVars) => Promise<unknown>;
	bulkUpdateStage: (vars: BulkUpdateStageDraftMutationVars) => Promise<unknown>;
	bulkDelete: (ids: string[]) => Promise<unknown>;
}

// --- Session State ---

export interface DraftSession {
	isActive: boolean;
	baselineByStage: Record<OrderStage, PendingRow[]>;
	pendingCommands: DraftCommand[];
	past: DraftCommand[];
	future: DraftCommand[];
	dirty: boolean;
	saving: boolean;
	saveError: string | null;
	touchedStages: Set<OrderStage>;
	lastTouchedAt: number | null;
	workspaceId: string;
}

// --- Recovery Snapshot ---

export interface DraftRecoverySnapshot {
	workspaceId: string;
	updatedAt: number;
	pendingCommands: DraftCommand[];
}

// --- Slice Interface ---

export interface DraftSessionState {
	draftSession: DraftSession;
}

export interface DraftSessionActions {
	applyCommand: (cmd: DraftCommand) => boolean;
	undoDraft: () => void;
	redoDraft: () => void;
	saveDraft: (mutations: DraftSaveMutations) => Promise<void>;
	discardDraft: () => void;
	restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => void;
	getWorkingRows: (stage: OrderStage) => PendingRow[] | undefined;
	_captureBaseline: () => void;
	_deriveWorkingRows: () => Record<OrderStage, PendingRow[]>;
	_persistRecovery: () => void;
	_clearRecovery: () => void;
}

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
		},
		pendingCommands: [],
		past: [],
		future: [],
		dirty: false,
		saving: false,
		saveError: null,
		touchedStages: new Set(),
		lastTouchedAt: null,
		workspaceId: getOrCreateWorkspaceId(),
	};

	return {
		draftSession: initialSession,

		_captureBaseline: () => {
			const baseline: Record<OrderStage, PendingRow[]> = {} as Record<
				OrderStage,
				PendingRow[]
			>;
			for (const stage of ORDER_STAGES) {
				baseline[stage] =
					queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)) ??
					[];
			}
			set((state) => ({
				draftSession: {
					...state.draftSession,
					baselineByStage: baseline,
					isActive: true,
				},
			}));
		},

		_deriveWorkingRows: () => {
			const state = get().draftSession;
			if (!state.isActive || state.pendingCommands.length === 0) {
				return state.baselineByStage;
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
					for (const stage of ORDER_STAGES) {
						working[stage] = working[stage].filter(
							(r) => !cmd.ids.includes(r.id),
						);
					}
				} else if (cmd.type === "moveRows") {
					const moved = working[cmd.sourceStage].filter((r) =>
						cmd.ids.includes(r.id),
					);
					working[cmd.sourceStage] = working[cmd.sourceStage].filter(
						(r) => !cmd.ids.includes(r.id),
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
				}
			};

			for (const cmd of state.pendingCommands) {
				applyCommandToWorking(cmd, working);
			}

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
						const uiSlice = useAppStore.getState();
						uiSlice.triggerBeastMode(row.id, Date.now());
						toast.error(
							`Missing required fields for: ${row.trackingId || row.id}`,
						);
						return false;
					}

					// Also validate partNumber, description, attachment
					if (!row.partNumber || !row.description) {
						toast.error(
							`Part number and description required for: ${row.trackingId || row.id}`,
						);
						return false;
					}

					if (!row.attachmentFilePath && !row.attachmentLink) {
						toast.error(`Attachment required for: ${row.trackingId || row.id}`);
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
					dirty: state.draftSession.pendingCommands.length > 1,
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
					dirty: true,
				},
			}));

			get()._persistRecovery();
		},

		saveDraft: async (mutations) => {
			const state = get().draftSession;
			if (state.dirty === false || state.saving) return;

			set((state) => ({
				draftSession: { ...state.draftSession, saving: true, saveError: null },
			}));

			try {
				// Execute all pending commands in order, tracking temp→real ID mappings
				// so that post-create commands (delete/move/patch) target the right Supabase rows.
				const idMap = new Map<string, string>();
				for (const cmd of state.pendingCommands) {
					await executeCommand(cmd, mutations, idMap);
				}

				// On success: clear session
				set((state) => ({
					draftSession: {
						...initialSession,
						workspaceId: state.draftSession.workspaceId,
					},
				}));

				// Invalidate touched stages
				const prevSession = state;
				for (const stage of prevSession.touchedStages) {
					queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) });
				}

				get()._clearRecovery();
			} catch (error) {
				const message = error instanceof Error ? error.message : "Save failed";
				set((state) => ({
					draftSession: {
						...state.draftSession,
						saving: false,
						saveError: message,
					},
				}));
				// Keep all draft state intact for retry
			}
		},

		discardDraft: () => {
			const state = get().draftSession;

			// Invalidate touched stages
			for (const stage of state.touchedStages) {
				queryClient.invalidateQueries({ queryKey: getOrdersQueryKey(stage) });
			}

			set((state) => ({
				draftSession: {
					...initialSession,
					workspaceId: state.draftSession.workspaceId,
				},
			}));

			get()._clearRecovery();
		},

		restoreFromRecovery: (snapshot: DraftRecoverySnapshot) => {
			// Capture fresh baseline from current RQ caches
			get()._captureBaseline();

			const newSession = get().draftSession;

			set(() => ({
				draftSession: {
					...newSession,
					pendingCommands: snapshot.pendingCommands,
					past: [],
					future: [],
					dirty: snapshot.pendingCommands.length > 0,
					touchedStages: new Set(getAllCommandStages(snapshot.pendingCommands)),
					lastTouchedAt: snapshot.updatedAt,
				},
			}));
		},

		getWorkingRows: (stage: OrderStage) => {
			const state = get().draftSession;
			if (!state.isActive || state.pendingCommands.length === 0) {
				return queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage));
			}
			return get()._deriveWorkingRows()[stage];
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
	return [];
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
		for (const child of deletes) {
			await executeCommand(child, mutations, idMap);
		}
		return;
	}

	const remapped = remapCommand(cmd, idMap);

	if (remapped.type === "patchRow") {
		await mutations.saveOrder({
			id: remapped.id,
			updates: remapped.updates,
			stage: remapped.destinationStage,
			sourceStage:
				remapped.sourceStage !== remapped.destinationStage
					? remapped.sourceStage
					: undefined,
		});
	} else if (remapped.type === "createRows") {
		for (const row of remapped.rows) {
			const result = await mutations.saveOrder({
				id: "",
				updates: row,
				stage: remapped.stage,
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
		});
	}
}
