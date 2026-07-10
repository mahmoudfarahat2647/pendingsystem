import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SUPABASE_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase-admin";
import { getStorageStats } from "@/services/storageStatsService";

export type { StorageStatsResponse } from "@/types";

export const runtime = "nodejs";

function createTimeoutFetch(timeoutMs: number): typeof fetch {
	return (input, init) => {
		const timeoutSignal = AbortSignal.timeout(timeoutMs);
		const signal =
			init?.signal == null
				? timeoutSignal
				: AbortSignal.any([init.signal, timeoutSignal]);
		return fetch(input, { ...init, signal });
	};
}

/**
 * GET /api/storage-stats
 *
 * Fetches real-time database and file storage usage from Supabase.
 */
export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const supabase = createServiceClient({
			fetch: createTimeoutFetch(SUPABASE_REQUEST_TIMEOUT_MS),
		});
		const data = await getStorageStats(supabase);
		return NextResponse.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error("Storage stats error:", error.message);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
		logger.error("Storage stats error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
