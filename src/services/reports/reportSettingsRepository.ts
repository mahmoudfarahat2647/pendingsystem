import { createServiceClient } from "@/lib/supabase-admin";
import {
	handleSupabaseError,
	ServiceError,
} from "@/services/orderServiceErrors";
import type { ReportSettings } from "@/types";

const DEFAULT_REPORT_SETTINGS = {
	emails: [],
	frequency: "Weekly",
	is_enabled: false,
} as const;

export async function getOrCreateReportSettings(): Promise<ReportSettings> {
	const supabase = createServiceClient();
	const { error: upsertError } = await supabase
		.from("report_settings")
		.upsert([{ ...DEFAULT_REPORT_SETTINGS, singleton: true }], {
			onConflict: "singleton",
			ignoreDuplicates: true,
		});
	if (upsertError) handleSupabaseError(upsertError);

	const { data, error } = await supabase
		.from("report_settings")
		.select("id, emails, frequency, is_enabled, last_sent_at")
		.single();
	if (error) handleSupabaseError(error);
	if (!data) throw new ServiceError("NOT_FOUND", "Report settings not found");
	return data;
}

export async function patchReportSettings(
	id: string,
	settings: Partial<ReportSettings>,
): Promise<ReportSettings> {
	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("report_settings")
		.update(settings)
		.eq("id", id)
		.select()
		.single();
	if (error) handleSupabaseError(error);
	if (!data) throw new ServiceError("NOT_FOUND", "Report settings not found");
	return data;
}
