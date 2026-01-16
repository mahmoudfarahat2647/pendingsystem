import { z } from 'zod';

// Status Enum Schema
export const StatusSchema = z.enum([
    "Pending", "Ordered", "Hold", "Booked", "Archived",
    "Reorder", "Call", "Main Sheet", "Orders", "Booking",
    "Archive", "Search Result"
]);

// Part Entry Schema
export const PartEntrySchema = z.object({
    id: z.string(),
    partNumber: z.string(),
    description: z.string(),
    rowId: z.string().optional(),
});

// Reminder Schema
export const ReminderSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    subject: z.string(),
}).nullable();

// Schema for PendingRow based on src/types/index.ts
// We enforce critical constraints for validation while transforming existing data.
export const PendingRowSchema = z.object({
    id: z.string().min(1), // ID is strictly required
    baseId: z.string().default(""), // Required in type, default to empty if missing
    trackingId: z.string().default(""),

    // Customer Info
    customerName: z.string().min(1, "Customer name is required"),
    company: z.string().optional(),
    vin: z.string().length(17, "VIN must be exactly 17 characters"),
    mobile: z.string().min(1, "Mobile number is required"),
    cntrRdg: z.number().nonnegative().optional().default(0), // Default to 0 if missing/invalid
    model: z.string().min(1, "Vehicle model is required"),

    // Logistics
    parts: z.array(PartEntrySchema).default([]),
    sabNumber: z.string().default(""),
    acceptedBy: z.string().default(""),
    requester: z.string().default(""),
    requestedBy: z.string().optional(),
    partStatus: z.string().optional(),

    // Legacy (These will be auto-synced via transform)
    partNumber: z.string().optional(),
    description: z.string().optional(),

    // Workflow
    status: StatusSchema.default("Pending"),
    rDate: z.string().default(""),

    // Warranty
    repairSystem: z.string().default(""),
    startWarranty: z.string().default(""),
    endWarranty: z.string().default(""),
    remainTime: z.string().default(""),

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
}).transform((data) => {
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
