import { createSeedClient } from "./supabase";

export async function seedReportSettings() {
	const db = createSeedClient();
	// report_settings uses upsert — only one row expected
	const { error } = await db
		.from("report_settings")
		.upsert({
			recipients: ["e2e-test@example.com"],
			frequency: "weekly",
		})
		.select();
	if (error) throw new Error(`seedReportSettings failed: ${error.message}`);
}
