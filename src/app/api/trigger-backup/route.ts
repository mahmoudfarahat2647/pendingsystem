import { errorResponse, successResponse } from "@/lib/apiResponse";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Manual backup trigger coordinating with GitHub Actions.
export async function POST() {
	const { headers } = await import("next/headers");
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
	}

	try {
		const githubToken = process.env.GITHUB_PAT;

		// Require GitHub PAT for security - no fallback
		const owner = process.env.GITHUB_OWNER || "mahmoudfarahat2647";
		const repo = process.env.GITHUB_REPO || "pendingsystem";
		const workflowId = "backup-reports.yml";

		const missingVars: string[] = [];
		if (!githubToken) missingVars.push("GITHUB_PAT");

		// Warn about missing owner/repo but allow defaults
		if (!process.env.GITHUB_OWNER) {
			logger.warn("GITHUB_OWNER not set, using default");
		}
		if (!process.env.GITHUB_REPO) {
			logger.warn("GITHUB_REPO not set, using default");
		}

		if (missingVars.length > 0) {
			logger.error(
				`Missing required environment variables: ${missingVars.join(", ")}`,
			);
			return errorResponse(
				"SERVER_ERROR",
				`Server configuration error: Missing ${missingVars.join(", ")}`,
				500,
			);
		}

		// Trigger the GitHub Actions workflow via dispatch
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${githubToken}`,
					Accept: "application/vnd.github.v3+json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ref: "main", // or the default branch
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("GitHub API error:", {
				status: response.status,
				body: errorText,
			});

			// Helpful error for common issues
			if (response.status === 404) {
				return errorResponse(
					"NOT_FOUND",
					"Workflow not found. Ensure backup-reports.yml is committed to the main branch.",
					404,
				);
			}

			if (response.status === 403) {
				return errorResponse(
					"FORBIDDEN",
					"GitHub token lacks permissions. Ensure PAT has 'workflows' scope.",
					403,
				);
			}

			return errorResponse(
				"EXTERNAL_SERVICE_ERROR",
				`GitHub trigger failed: ${response.statusText}`,
				response.status,
			);
		}

		return successResponse(
			undefined,
			"Backup workflow triggered successfully on GitHub Actions",
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error("Backup trigger error:", error.message);
			return errorResponse(
				"SERVER_ERROR",
				error.message || "An internal error occurred",
				500,
			);
		} else {
			logger.error("Backup trigger error:", error);
			return errorResponse("SERVER_ERROR", "An internal error occurred", 500);
		}
	}
}
