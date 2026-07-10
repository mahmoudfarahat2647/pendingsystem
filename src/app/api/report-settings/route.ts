import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { ReportSettingsPatchSchema } from "@/schemas/reportSettings.schema";
import {
	getOrCreateReportSettings,
	patchReportSettings,
} from "@/services/reports/reportSettingsRepository";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		return NextResponse.json(await getOrCreateReportSettings());
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[report-settings GET]", message);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		let body: { id?: string } & Record<string, unknown>;
		try {
			body = (await req.json()) as { id?: string } & Record<string, unknown>;
		} catch {
			return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
		}

		const { id, ...rest } = body;
		if (!id)
			return NextResponse.json(
				{ error: "Missing settings id" },
				{ status: 400 },
			);

		const parsed = ReportSettingsPatchSchema.safeParse(rest);
		if (!parsed.success)
			return NextResponse.json(
				{
					error: "Invalid report settings payload",
					issues: parsed.error.issues,
				},
				{ status: 400 },
			);

		return NextResponse.json(await patchReportSettings(id, parsed.data));
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[report-settings PATCH]", message);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
