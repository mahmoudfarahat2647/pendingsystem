import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
	getOrCreateReportSettings,
	patchReportSettings,
} from "@/services/reports/reportSettingsRepository";
import type { ReportSettings } from "@/types";

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
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = (await req.json()) as { id: string } & Partial<ReportSettings>;
	const { id, ...settings } = body;
	if (!id)
		return NextResponse.json({ error: "Missing settings id" }, { status: 400 });

	try {
		return NextResponse.json(await patchReportSettings(id, settings));
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[report-settings PATCH]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
