/**
 * Builds a list of trusted origins for Better Auth from Vercel deployment environment variables.
 * Uses deployment-scoped Vercel env vars instead of a wildcard pattern to prevent
 * trusting attacker-controlled free Vercel deployments.
 *
 * @param env - NodeJS.ProcessEnv or object with Vercel deployment variables
 * @returns Array of origin URLs (https://hostname format), deduplicated and filtered
 */
export function buildTrustedOrigins(
	env: Record<string, string | undefined>,
): string[] {
	const origins: string[] = [];

	if (env.VERCEL_URL) {
		origins.push(`https://${env.VERCEL_URL}`);
	}

	if (env.VERCEL_BRANCH_URL) {
		origins.push(`https://${env.VERCEL_BRANCH_URL}`);
	}

	if (env.VERCEL_PROJECT_PRODUCTION_URL) {
		origins.push(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
	}

	// Deduplicate while preserving order
	return [...new Set(origins)];
}
