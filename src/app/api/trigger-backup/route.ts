import { errorResponse, successResponse } from "@/lib/apiResponse";
import { requireAllowedUser } from "@/lib/auth";

export const runtime = "nodejs";

// [CRITICAL] PROTECTED ROUTE - MANUAL BACKUP TRIGGER
// Coordinates with GitHub Actions to run the protected backup script.
export async function POST() {
	try {
		// Verify authentication via cookies
		const auth = await requireAllowedUser();
		if (!auth.success) {
			return new Response(
				JSON.stringify({ success: false, error: auth.error?.message }),
				{
					status: auth.error?.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		const githubToken = process.env.GITHUB_PAT;
		// Prioritize env vars, but keep fallbacks if they match the user's hardcoded values from before,
		// OR enforce them. The plan said "Add explicit checks", so we will require them or use the defaults IF they are safe.
		// Actually, for better debugging, let's enforce them or at least log clearly.
		// Given the plan "You must add...", I will treat them as required.
		const owner = process.env.GITHUB_OWNER || "mahmoudfarahat2647"; // Keep fallback for backward compat but warn if missing?
		// No, let's stick to the plan: "Add explicit checks".
		// If I strictly require them, it might break local if local .env doesn't have them.
		// User said they work on localhost. Localhost probably uses the hardcoded defaults if variables aren't in .env.local.
		// To be safe and avoid breaking localhost, I will KEEP the defaults but maybe log them?
		// Actually, the plan says "Action Required: You must add...".
		// Use the defaults as a fallback to prevent immediate breakage, but add checks.

		// Revised approach based on user memory: "Modify ONLY what is explicitly required... preserve existing functionality".
		// Existing functionality used defaults. I should probably keep defaults to not break localhost if the user hasn't added env vars locally yet.
		// BUT the user accepted the plan which said "Add explicit checks".
		// I will add the checks but keep the defaults for the owner/repo if they are missing,
		// UNLESS the user explicitly wants to force env vars.
		// The issue is *backup fails on site*. The most critical missing one is PAT.

		// Let's implement the robust check specifically for PAT (critical)
		// and add info about Owner/Repo availability.

		const repo = process.env.GITHUB_REPO || "pendingsystem";
		const workflowId = "backup-reports.yml";

		const missingVars: string[] = [];
		if (!githubToken) missingVars.push("GITHUB_PAT");
		// We'll trust the defaults for Owner/Repo for now to avoid breaking local,
		// unless we want to enforce them.
		// Let's strictly follow the "improvement" part: report what's missing.

		if (missingVars.length > 0) {
			console.error(
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
			console.error("GitHub API error:", response.status, errorText);

			// Helpful error for common issues
			if (response.status === 404) {
				return errorResponse(
					"NOT_FOUND",
					"Workflow not found. Ensure backup-reports.yml is committed to the main branch.",
					404,
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
	} catch (error: any) {
		console.error("Backup trigger error:", error);
		return errorResponse(
			"SERVER_ERROR",
			error.message || "An internal error occurred",
			500,
		);
	}
}
