import { z } from "zod";
import { ORDER_STAGE_VALUES } from "@/domain/order/orderStage";

// Schemas for the local draft-session command overlay (src/store/slices/draftSessionSlice.ts).
// These validate the *shape* of a `DraftCommand` / recovery snapshot pulled back out of
// localStorage — they intentionally stay lenient on row/patch payload contents (arbitrary
// key/value bags) since that data is already governed by PendingRowSchema at the Supabase
// boundary. The goal here is structural integrity of a persisted, untrusted JSON blob, not
// full business-rule revalidation.

const OrderStageSchema = z.enum(ORDER_STAGE_VALUES);

// A row must at minimum carry a non-empty id; the rest of its fields are passed through
// untouched so this schema doesn't have to be kept in lockstep with PendingRow's shape.
const DraftRowSchema = z.object({ id: z.string().min(1) }).passthrough();

const PatchRowCommandSchema = z.object({
	type: z.literal("patchRow"),
	id: z.string().min(1),
	sourceStage: OrderStageSchema,
	destinationStage: OrderStageSchema,
	updates: z.record(z.string(), z.unknown()),
	previousValues: z.record(z.string(), z.unknown()),
});

const CreateRowsCommandSchema = z.object({
	type: z.literal("createRows"),
	stage: OrderStageSchema,
	rows: z.array(DraftRowSchema),
});

const DeleteRowsCommandSchema = z.object({
	type: z.literal("deleteRows"),
	ids: z.array(z.string().min(1)),
});

const MoveRowsCommandSchema = z.object({
	type: z.literal("moveRows"),
	ids: z.array(z.string().min(1)),
	sourceStage: OrderStageSchema,
	destinationStage: OrderStageSchema,
	fieldOverrides: z.record(z.string(), z.unknown()).optional(),
});

const AtomicCommandSchema = z.discriminatedUnion("type", [
	PatchRowCommandSchema,
	CreateRowsCommandSchema,
	DeleteRowsCommandSchema,
	MoveRowsCommandSchema,
]);

const CompositeCommandSchema = z.object({
	type: z.literal("composite"),
	label: z.string(),
	children: z.array(AtomicCommandSchema),
});

export const DraftCommandSchema = z.discriminatedUnion("type", [
	PatchRowCommandSchema,
	CreateRowsCommandSchema,
	DeleteRowsCommandSchema,
	MoveRowsCommandSchema,
	CompositeCommandSchema,
]);

export const DraftRecoverySnapshotSchema = z.object({
	workspaceId: z.string().min(1),
	updatedAt: z.number(),
	pendingCommands: z.array(DraftCommandSchema),
});
