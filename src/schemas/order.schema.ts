import { z } from "zod";

// Status Enum Schema
export const StatusSchema = z.enum([
	"Pending",
	"Ordered",
	"Hold",
	"Booked",
	"Archived",
	"Reorder",
	"Call",
	"Main Sheet",
	"Orders",
	"Booking",
	"Archive",
	"Search Result",
]);

// Part Entry Schema
export const PartEntrySchema = z.object({
	id: z.string(),
	partNumber: z.string(),
	description: z.string(),
	rowId: z.string().optional(),
});

// Reminder Schema
export const ReminderSchema = z
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
		customerName: z.preprocess(
			(val) => {
				// Handle both string and string[] formats from database
				if (Array.isArray(val)) {
					return val.length > 0 ? String(val[0]) : "";
				}
				return String(val || "");
			},
			z.string().min(1, "Customer name is required"),
		),
		company: z.string().nullish(), // Allow null
		vin: z.string().min(1, "VIN is required"),
		mobile: z.preprocess(
			(val) => {
				// Handle both string and string[] formats from database
				if (Array.isArray(val)) {
					return val.length > 0 ? String(val[0]) : "";
				}
				return String(val || "");
			},
			z.string().min(1, "Mobile number is required"),
		),
		cntrRdg: z.preprocess(
			(val) => Number(val) || 0,
			z.number().nonnegative().default(0),
		),
		model: z.preprocess(
			(val) => {
				// Handle both string and string[] formats from database
				if (Array.isArray(val)) {
					return val.length > 0 ? String(val[0]) : "";
				}
				return String(val || "");
			},
			z.string().min(1, "Model is required"),
		),

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
		partStatus: z.string().optional(),

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
		noteContent: z.string().optional(),
		actionNote: z.string().optional(),
		bookingDate: z.string().optional(),
		bookingNote: z.string().optional(),
		bookingStatus: z.string().optional(),
		hasAttachment: z.boolean().optional(),
		attachmentPath: z.string().optional(),
		reminder: ReminderSchema.optional(),
		archiveReason: z.string().optional(),
		archivedAt: z.string().optional(),
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

// Infer types from schemas
export type Status = z.infer<typeof StatusSchema>;
export type PartEntry = z.infer<typeof PartEntrySchema>;
export type PendingRow = z.infer<typeof PendingRowSchema>;
