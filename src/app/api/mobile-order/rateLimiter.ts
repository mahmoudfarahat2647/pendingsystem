import type { SupabaseClient } from "@supabase/supabase-js";

export const RATE_LIMIT_MAX = 30;

export async function isRateLimited(
	supabase: SupabaseClient,
	ip: string,
): Promise<boolean> {
	// Probabilistic prune (1% of requests) — keeps the table bounded
	// without a dedicated cron job.
	if (Math.random() < 0.01) {
		void supabase.rpc("prune_rate_limits");
	}

	const { data, error } = await supabase.rpc("check_rate_limit", {
		p_ip: ip,
		p_max_requests: RATE_LIMIT_MAX,
	});

	if (error) {
		// Fail open: a DB error should not block legitimate requests.
		console.error("[mobile-order] rate limit check error:", error.message);
		return false;
	}

	return data === true;
}
