import { errorResponse, successResponse } from "@/lib/apiResponse";
import { addRateLimitHeaders, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Manual backup trigger coordinating with GitHub Actions.
export async function POST(request: Request) {
	// Apply rate limiting
	const rateLimitResult = rateLimit(request);

	if (!rateLimitResult.success) {
		const response = errorResponse(
			"RATE_LIMITED",
			"Too many requests. Please try again later.",
			429,
		);
		return addRateLimitHeaders(response, rateLimitResult);
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
			console.warn("GITHUB_OWNER not set, using default");
		}
		if (!process.env.GITHUB_REPO) {
			console.warn("GITHUB_REPO not set, using default");
		}

		if (missingVars.length > 0) {
			console.error(
				`Missing required environment variables: ${missingVars.join(", ")}`,
			);
			const response = errorResponse(
				"SERVER_ERROR",
				`Server configuration error: Missing ${missingVars.join(", ")}`,
				500,
			);
			return addRateLimitHeaders(response, rateLimitResult);
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
			console.error("GitHub API error:", response.status, errorText);

			// Helpful error for common issues
			if (response.status === 404) {
				const errorRes = errorResponse(
					"NOT_FOUND",
					"Workflow not found. Ensure backup-reports.yml is committed to the main branch.",
					404,
				);
				return addRateLimitHeaders(errorRes, rateLimitResult);
			}

			if (response.status === 403) {
				const errorRes = errorResponse(
					"FORBIDDEN",
					"GitHub token lacks permissions. Ensure PAT has 'workflows' scope.",
					403,
				);
				return addRateLimitHeaders(errorRes, rateLimitResult);
			}

			const errorRes = errorResponse(
				"EXTERNAL_SERVICE_ERROR",
				`GitHub trigger failed: ${response.statusText}`,
				response.status,
			);
			return addRateLimitHeaders(errorRes, rateLimitResult);
		}

		const successRes = successResponse(
			undefined,
			"Backup workflow triggered successfully on GitHub Actions",
		);
		return addRateLimitHeaders(successRes, rateLimitResult);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("Backup trigger error:", error.message);
			const response = errorResponse(
				"SERVER_ERROR",
				error.message || "An internal error occurred",
				500,
			);
			return addRateLimitHeaders(response, rateLimitResult);
		} else {
			console.error("Backup trigger error:", error);
			const response = errorResponse(
				"SERVER_ERROR",
				"An internal error occurred",
				500,
			);
			return addRateLimitHeaders(response, rateLimitResult);
		}
	}
}
