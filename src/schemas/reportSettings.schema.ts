import { z } from "zod";

const REPORT_FREQUENCY_PATTERN = /^(?:Daily|Weekly(?:-[0-6])?|Monthly|Yearly)$/;

// Report Settings Patch Schema
// Only these fields are client-writable via PATCH /api/report-settings.
// System-managed columns (id, singleton, last_sent_at, etc.) are intentionally
// excluded — `.strict()` rejects any unlisted key so a caller cannot mass-assign
// internal/system-managed fields through this endpoint.
export const ReportSettingsPatchSchema = z
	.object({
		emails: z.array(z.string().email()).optional(),
		frequency: z
			.string()
			.regex(
				REPORT_FREQUENCY_PATTERN,
				"frequency must be Daily, Weekly, Weekly-0 through Weekly-6, Monthly, or Yearly",
			)
			.optional(),
		is_enabled: z.boolean().optional(),
	})
	.strict();

export type ReportSettingsPatch = z.infer<typeof ReportSettingsPatchSchema>;
