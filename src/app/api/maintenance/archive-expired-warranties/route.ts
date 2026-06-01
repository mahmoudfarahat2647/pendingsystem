import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { warrantyMaintenanceService } from "@/services/warrantyMaintenanceService";

export async function GET(req: NextRequest) {
	const token = req.headers.get("authorization")?.replace("Bearer ", "");
	if (!token || token !== process.env.CRON_SECRET) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await warrantyMaintenanceService.archiveExpiredWarranties();
		return NextResponse.json({ ok: true, ...result });
	} catch (e) {
		logger.error("[archive-expired-warranties] Unhandled error:", e);
		return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
	}
}
