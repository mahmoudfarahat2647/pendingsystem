import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { pool } from "@/lib/postgres";
import { createServiceClient } from "@/lib/supabase-admin";

export async function checkAndApplyRateLimit(ip: string): Promise<boolean> {
	const supabase = createServiceClient();
	// 1% chance per request to prune expired rate-limit records (lazy cleanup, avoids a scheduled job)
	if (Math.random() < 0.01) {
		void supabase.rpc("prune_rate_limits");
	}
	const { data: limited, error } = await supabase.rpc("check_rate_limit", {
		p_ip: ip,
		p_max_requests: 3,
	});
	return !error && limited === true;
}

export async function sendPasswordResetIfUserExists(
	username: string,
): Promise<void> {
	const result = await pool.query<{ email: string }>(
		"SELECT email FROM auth_users WHERE username = $1 LIMIT 1",
		[username],
	);
	if (result.rows.length === 0) return;

	const email = result.rows[0].email;
	const redirectTo = `${process.env.BETTER_AUTH_URL}/reset-password`;
	try {
		await auth.api.requestPasswordReset({ body: { email, redirectTo } });
	} catch (error) {
		logger.error("Password reset email dispatch failed", {
			username,
			email,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
