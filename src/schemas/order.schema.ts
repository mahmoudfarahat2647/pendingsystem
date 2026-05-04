import { z } from "zod";
import { normalizeNullableCompanyName } from "@/lib/company";
import { normalizeMileageAsNumber } from "@/lib/utils";

// Status Schema — accepts any string; user-managed statuses (Arrived, Reserve, etc.)
// are now stored here alongside workflow markers (Reorder) and stage defaults (Pending)
const StatusSchema = z.string();

// Part Entry Schema
export const PartEntrySchema = z.object({
	id: z.string(),
	partNumber: z.string(),
	description: z.string(),
	rowId: z.string().optional(),
});

// Reminder Schema
const ReminderSchema = z
	.object({
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		time: z.string().regex(/^\d{2}:\d{2}$/),
		subject: z.string(),
	})
	.nullable();

// [CRITICAL] Order Schema - Single Source of Truth
// These schemas govern data integrity across the entire application.
// Structural changes require careful impact analysis of Supabase services and UI components.

// Schema for PendingRow based on src/types/index.ts
// We enforce critical constraints for validation while transforming existing data.
export const PendingRowSchema = z
	.object({
		id: z.string().min(1), // ID is strictly required
		baseId: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		trackingId: z
			.string()
			.nullish()
			.transform((v) => v || ""),

		// Customer Info
		// Allow empty string — draft orders may have no customer name yet.
		// Strict .min(1) validation is enforced by BeastModeSchema on Commit only.
		customerName: z.preprocess((val) => {
			// Handle both string and string[] formats from database
			if (Array.isArray(val)) {
				return val.length > 0 ? String(val[0]) : "";
			}
			return typeof val === "string" || typeof val === "number"
				? String(val)
				: "";
		}, z.string()),
		company: z.preprocess(normalizeNullableCompanyName, z.string().nullish()),
		// Allow empty string — draft orders may have no VIN yet.
		vin: z.string().default(""),
		// Allow empty string — draft orders may have no mobile yet.
		mobile: z.preprocess((val) => {
			// Handle both string and string[] formats from database
			if (Array.isArray(val)) {
				return val.length > 0 ? String(val[0]) : "";
			}
			return typeof val === "string" || typeof val === "number"
				? String(val)
				: "";
		}, z.string()),
		cntrRdg: z.preprocess(
			(val) =>
				normalizeMileageAsNumber(val as string | number | null | undefined),
			z.number().nonnegative().default(0),
		),
		model: z.preprocess((val) => {
			// Handle both string and string[] formats from database
			if (Array.isArray(val)) {
				return val.length > 0 ? String(val[0]) : "";
			}
			return typeof val === "string" || typeof val === "number"
				? String(val)
				: "";
		}, z.string()),

		// Logistics
		parts: z.array(PartEntrySchema).default([]),
		sabNumber: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		acceptedBy: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		requester: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		requestedBy: z.string().optional(),

		// Legacy (These will be auto-synced via transform)
		partNumber: z.string().optional(),
		description: z.string().optional(),

		// Workflow
		status: StatusSchema.default("Pending"),
		rDate: z.string().default(""),

		// Warranty
		repairSystem: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		startWarranty: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		endWarranty: z
			.string()
			.nullish()
			.transform((v) => v || ""),
		remainTime: z
			.string()
			.nullish()
			.transform((v) => v || ""),

		// Meta
		noteHistory: z.string().optional(),
		noteContent: z.string().optional(),
		actionNote: z.string().optional(),
		bookingDate: z.string().optional(),
		bookingNote: z.string().optional(),
		bookingStatus: z.string().optional(),
		hasAttachment: z.boolean().optional(),
		attachmentLink: z.string().optional(),
		attachmentFilePath: z.string().optional(),
		reminder: ReminderSchema.optional(),
		archiveReason: z.string().optional(),
		archivedAt: z.string().optional(),
		reserved: z.boolean().optional(),
		reservedAt: z.string().optional(),
		sourceType: z.string().optional(),
		stage: z.string().optional(),
	})
	.transform((data) => {
		// AUTO-SYNC: Legacy fields always reflect parts[0] if available
		// This ensures that partNumber/description are never stale compared to the parts array
		const firstPart = data.parts?.[0];
		return {
			...data,
			partNumber: firstPart?.partNumber || data.partNumber || "",
			description: firstPart?.description || data.description || "",
		};
	});

// ReminderInputSchema — used for form submission only (not for mapSupabaseOrder).
// Adds future-date validation on top of the base ReminderSchema shape.
// Keep ReminderSchema unchanged inside PendingRowSchema to avoid rejecting
// historical reminders with past dates already stored in the database.
export const ReminderInputSchema = z
	.object({
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		time: z.string().regex(/^\d{2}:\d{2}$/),
		subject: z.string(),
	})
	.nullable()
	.superRefine((val, ctx) => {
		if (val === null) return;
		const reminderDateTime = new Date(`${val.date}T${val.time}`);
		if (reminderDateTime <= new Date()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Reminder date/time must be in the future",
			});
		}
	});

export type PartEntry = z.infer<typeof PartEntrySchema>;
export type PendingRow = z.infer<typeof PendingRowSchema>;
