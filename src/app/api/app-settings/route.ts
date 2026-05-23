import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase-admin";
import { mapKeysToCamel } from "@/lib/utils";
import type { AppSettings } from "@/services/appSettingsService";

export const runtime = "nodejs";

const PROTECTED_REPAIR_SYSTEMS = ["ضمان"];

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		let patch = (await req.json()) as Partial<AppSettings>;

		if (patch.repairSystems !== undefined) {
			const current = patch.repairSystems;
			const missing = PROTECTED_REPAIR_SYSTEMS.filter(
				(s) => !current.includes(s),
			);
			if (missing.length > 0) {
				patch = { ...patch, repairSystems: [...current, ...missing] };
			}
		}

		const updatePayload: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};
		if (patch.models !== undefined) updatePayload.models = patch.models;
		if (patch.repairSystems !== undefined)
			updatePayload.repair_systems = patch.repairSystems;
		if (patch.requesters !== undefined)
			updatePayload.requesters = patch.requesters;

		const supabase = createServiceClient();

		const { data, error } = await supabase
			.from("app_settings")
			.update(updatePayload)
			.eq("id", 1)
			.select("models, repair_systems, requesters")
			.single();

		if (error) throw new Error(error.message);

		return NextResponse.json(
			mapKeysToCamel<AppSettings>(data as Record<string, unknown>),
		);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[app-settings PATCH]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
