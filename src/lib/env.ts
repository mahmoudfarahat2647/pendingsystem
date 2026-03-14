/**
 * Environment variable validation for production deployment.
 *
 * Validates required environment variables at startup and provides
 * type-safe access to configuration values.
 */

export interface EnvConfig {
	// Supabase
	readonly NEXT_PUBLIC_SUPABASE_URL: string;
	readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
	readonly SUPABASE_SERVICE_ROLE_KEY: string | undefined;

	// GitHub
	readonly GITHUB_PAT: string | undefined;
	readonly GITHUB_OWNER: string | undefined;
	readonly GITHUB_REPO: string | undefined;

	// Application
	readonly NEXT_PUBLIC_SITE_URL: string | undefined;
	readonly NEXT_PUBLIC_SETTINGS_PASSWORD: string | undefined;
	readonly NODE_ENV: "development" | "production" | "test";
}

/**
 * Get validated environment variables
 * Throws on missing required variables in production
 */
export function getEnv(): EnvConfig {
	const requiredMissing: string[] = [];

	// Required in all environments
	const requiredVars: (keyof EnvConfig)[] = [
		"NEXT_PUBLIC_SUPABASE_URL",
		"NEXT_PUBLIC_SUPABASE_ANON_KEY",
		"NODE_ENV",
	];

	const config: Partial<EnvConfig> = {};

	for (const key of requiredVars) {
		const value = process.env[key];
		if (!value) {
			if (process.env.NODE_ENV === "production") {
				requiredMissing.push(key);
			}
			// Allow defaults for development
			(config as Record<string, unknown>)[key] =
				value ?? (key === "NODE_ENV" ? "development" : "");
		} else {
			(config as Record<string, unknown>)[key] = value;
		}
	}

	// Optional variables
	const optionalVars: (keyof EnvConfig)[] = [
		"SUPABASE_SERVICE_ROLE_KEY",
		"GITHUB_PAT",
		"GITHUB_OWNER",
		"GITHUB_REPO",
		"NEXT_PUBLIC_SITE_URL",
		"NEXT_PUBLIC_SETTINGS_PASSWORD",
	];

	for (const key of optionalVars) {
		(config as Record<string, unknown>)[key] = process.env[key];
	}

	// Throw if critical variables are missing in production
	if (requiredMissing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${requiredMissing.join(", ")}`,
		);
	}

	// Validate Supabase URL format
	const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL;
	if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
		throw new Error("NEXT_PUBLIC_SUPABASE_URL must start with https://");
	}

	return config as EnvConfig;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
	return process.env.NODE_ENV === "development";
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
	return process.env.NODE_ENV === "test";
}

// Export singleton instance
export const env = getEnv();
