import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { triggerGithubBackup } from "@/services/backupService";

export const runtime = "nodejs";

export async function POST() {
	const { headers } = await import("next/headers");
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

	try {
		await triggerGithubBackup();
		return successResponse(
			undefined,
			"Backup workflow triggered successfully on GitHub Actions",
		);
	} catch (error: unknown) {
		const err = error as Error & { code?: string; status?: number };
		const message = err.message || "An internal error occurred";
		logger.error("Backup trigger error:", message);
		return errorResponse(
			(err.code as Parameters<typeof errorResponse>[0]) ?? "SERVER_ERROR",
			message,
			err.status ?? 500,
		);
	}
}
