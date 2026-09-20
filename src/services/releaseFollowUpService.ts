import { supabase as supabaseDefault } from "@/lib/supabase";
import { createReleaseFollowUpRepository } from "./releaseFollowUpRepository";

export type { ReleaseFollowUp } from "@/schemas/releaseFollowUp.schema";
export { createReleaseFollowUpRepository } from "./releaseFollowUpRepository";

export const releaseFollowUpService =
	createReleaseFollowUpRepository(supabaseDefault);
