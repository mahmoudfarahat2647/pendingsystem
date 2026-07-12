import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createNotificationCandidatesRepository } from "@/services/notifications/notificationCandidatesRepository";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const repository = createNotificationCandidatesRepository();
		const candidates = await repository.getDueNotificationCandidates();
		return NextResponse.json({ candidates });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Internal server error";
		logger.error("[notifications GET]", message);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
