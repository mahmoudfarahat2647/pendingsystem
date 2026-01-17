import { successResponse, errorResponse } from "@/lib/apiResponse";

// [CRITICAL] PROTECTED ROUTE - MANUAL BACKUP TRIGGER
// Coordinates with GitHub Actions to run the protected backup script.
export async function POST() {
    try {
        const githubToken = process.env.GITHUB_PAT;
        const owner = process.env.GITHUB_OWNER || "mahmoudfarahat2647";
        const repo = process.env.GITHUB_REPO || "pendingsystem";
        const workflowId = "backup-reports.yml";

        if (!githubToken) {
            console.error("Missing GITHUB_PAT environment variable");
            return errorResponse(
                "SERVER_ERROR",
                "Server configuration error: GitHub Token missing",
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
        return errorResponse("SERVER_ERROR", error.message || "An internal error occurred", 500);
    }
}
