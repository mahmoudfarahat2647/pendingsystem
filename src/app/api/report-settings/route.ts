import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase-admin";
import type { ReportSettings } from "@/store/types";

export const runtime = "nodejs";

const DEFAULT_REPORT_SETTINGS = {
	emails: [],
	frequency: "Weekly",
	is_enabled: false,
} as const;

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const supabase = createServiceClient();

		// Atomic singleton creation: inserts defaults only when the table is
		// empty (ON CONFLICT DO NOTHING). Concurrent first-load requests both
		// hit this upsert; the unique index on `singleton` ensures only one
		// row is ever inserted.
		const { error: upsertError } = await supabase
			.from("report_settings")
			.upsert([{ ...DEFAULT_REPORT_SETTINGS, singleton: true }], {
				onConflict: "singleton",
				ignoreDuplicates: true,
			});
		if (upsertError) throw new Error(upsertError.message);

		// Exactly one row is now guaranteed — fetch it.
		const { data, error } = await supabase
			.from("report_settings")
			.select("id, emails, frequency, is_enabled, last_sent_at")
			.single();
		if (error) throw new Error(error.message);

		return NextResponse.json(data as ReportSettings);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[report-settings GET]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await req.json()) as { id: string } & Partial<ReportSettings>;
		const { id, ...settings } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "Missing settings id" },
				{ status: 400 },
			);
		}

		const supabase = createServiceClient();

		const { data, error } = await supabase
			.from("report_settings")
			.update(settings)
			.eq("id", id)
			.select()
			.single();

		if (error) throw new Error(error.message);

		return NextResponse.json(data as ReportSettings);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[report-settings PATCH]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
