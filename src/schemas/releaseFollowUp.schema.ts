import { z } from "zod";

// Validates a `release_follow_ups` row (see supabase/migrations/20260920_add_release_follow_ups.sql).
export const ReleaseFollowUpSchema = z.object({
	vin: z.string().min(1),
	nextDueAt: z.string(),
	referenceRowId: z.string().nullable().default(null),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type ReleaseFollowUp = z.infer<typeof ReleaseFollowUpSchema>;
