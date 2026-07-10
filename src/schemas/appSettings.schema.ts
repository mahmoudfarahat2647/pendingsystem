import { z } from "zod";

// Bounded string list used for the dropdown option lists (models,
// repair systems, requesters) stored in `app_settings`. Bounds mirror the
// convention in `mobileOrder.schema.ts` (per-item string caps in the
// 60-500 range, array caps sized to realistic list lengths): 200 entries
// is far beyond any real-world option list, and 100 chars comfortably
// covers the longest existing labels (e.g. multi-word model/repair-system
// names) while blocking oversized payloads.
const OptionListSchema = z.array(z.string().max(100)).max(200);

export const AppSettingsPatchSchema = z.object({
	models: OptionListSchema.optional(),
	repairSystems: OptionListSchema.optional(),
	requesters: OptionListSchema.optional(),
});

export type AppSettingsPatch = z.infer<typeof AppSettingsPatchSchema>;
