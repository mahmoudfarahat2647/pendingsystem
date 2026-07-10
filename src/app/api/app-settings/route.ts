import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { AppSettingsPatchSchema } from "@/schemas/appSettings.schema";
import { updateAppSettings } from "@/services/appSettingsRepository";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const parsed = AppSettingsPatchSchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", issues: parsed.error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(await updateAppSettings(parsed.data));
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[app-settings PATCH]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
