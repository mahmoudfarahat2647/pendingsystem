import { logger } from "@/lib/logger";

export async function triggerGithubBackup(): Promise<void> {
	const githubToken = process.env.GITHUB_PAT;
	const owner = process.env.GITHUB_OWNER || "mahmoudfarahat2647";
	const repo = process.env.GITHUB_REPO || "pendingsystem";
	const workflowId = "backup-reports.yml";

	if (!githubToken) {
		logger.error("Missing required environment variables: GITHUB_PAT");
		const err = new Error(
			"Server configuration error: Missing GITHUB_PAT",
		) as Error & { code: string; status: number };
		err.code = "SERVER_ERROR";
		err.status = 500;
		throw err;
	}

	if (!process.env.GITHUB_OWNER)
		logger.warn("GITHUB_OWNER not set, using default");
	if (!process.env.GITHUB_REPO)
		logger.warn("GITHUB_REPO not set, using default");

	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: "application/vnd.github.v3+json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ref: "main" }),
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		logger.error("GitHub API error:", {
			status: response.status,
			body: errorText,
		});

		const err = new Error() as Error & { code: string; status: number };
		if (response.status === 404) {
			err.message =
				"Workflow not found. Ensure backup-reports.yml is committed to the main branch.";
			err.code = "NOT_FOUND";
			err.status = 404;
		} else if (response.status === 403) {
			err.message =
				"GitHub token lacks permissions. Ensure PAT has 'workflows' scope.";
			err.code = "FORBIDDEN";
			err.status = 403;
		} else {
			err.message = `GitHub trigger failed: ${response.statusText}`;
			err.code = "EXTERNAL_SERVICE_ERROR";
			err.status = response.status;
		}
		throw err;
	}
}
