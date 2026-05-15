import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { AppSettings } from "@/services/appSettingsService";

export const runtime = "nodejs";

function createServiceClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error("Missing Supabase service configuration");
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

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

		return NextResponse.json({
			models: data.models as string[],
			repairSystems: data.repair_systems as string[],
			requesters: data.requesters as string[],
		} satisfies AppSettings);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		console.error("[app-settings PATCH]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
