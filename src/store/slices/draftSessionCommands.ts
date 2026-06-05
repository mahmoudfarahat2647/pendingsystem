import type { OrderStage } from "@/services/orderService";
import type { PendingRow } from "@/types";

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

interface CompositeCommand {
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

interface SaveOrderDraftMutationVars {
	id: string;
	updates: Partial<PendingRow>;
	stage: OrderStage;
	sourceStage?: OrderStage;
	idempotencyKey?: string;
}

interface BulkUpdateStageDraftMutationVars {
	ids: string[];
	stage: OrderStage;
	silentErrorToast?: boolean;
}

export interface DraftSaveMutations {
	saveOrder: (vars: SaveOrderDraftMutationVars) => Promise<unknown>;
	bulkUpdateStage: (vars: BulkUpdateStageDraftMutationVars) => Promise<unknown>;
	bulkDelete: (ids: string[]) => Promise<unknown>;
}

export interface DraftSession {
	isActive: boolean;
	baselineByStage: Record<OrderStage, PendingRow[]>;
	derivedRowsRevision: number;
	pendingCommands: DraftCommand[];
	past: DraftCommand[];
	future: DraftCommand[];
	dirty: boolean;
	saving: boolean;
	saveError: string | null;
	touchedStages: Set<OrderStage>;
	lastTouchedAt: number | null;
	workspaceId: string;
	saveCheckpoint: {
		nextIndex: number;
		idMapEntries: [string, string][];
	} | null;
}

export interface DraftRecoverySnapshot {
	workspaceId: string;
	updatedAt: number;
	pendingCommands: DraftCommand[];
}
