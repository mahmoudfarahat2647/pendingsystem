import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/postgres";

// Simple in-memory rate limiter: ip -> [timestamp, ...]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const timestamps = rateLimitMap.get(ip) ?? [];
	// Remove timestamps outside the window
	const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
	rateLimitMap.set(ip, recent);
	if (recent.length >= RATE_LIMIT_MAX) {
		return true;
	}
	recent.push(now);
	rateLimitMap.set(ip, recent);
	return false;
}

const GENERIC_RESPONSE = {
	success: true,
	message: "If that username exists, a reset link has been sent.",
};

export async function POST(request: NextRequest) {
	const start = Date.now();

	// Get IP for rate limiting
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"unknown";

	// Enforce minimum 500ms response time regardless of path taken
	const ensureMinDelay = async () => {
		const elapsed = Date.now() - start;
		if (elapsed < 500) {
			await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
		}
	};

	if (isRateLimited(ip)) {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	let username: string;
	try {
		const body = await request.json();
		username = String(body.username ?? "")
			.toLowerCase()
			.trim();
	} catch {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	if (!username) {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	try {
		// Look up email by username
		const result = await pool.query<{ email: string }>(
			"SELECT email FROM auth_users WHERE username = $1 LIMIT 1",
			[username],
		);

		if (result.rows.length > 0) {
			const email = result.rows[0].email;
			const redirectTo = `${process.env.BETTER_AUTH_URL}/reset-password`;

			// Fire and forget — do NOT await. This prevents timing differences
			// between "username found" and "username not found" paths.
			auth.api.requestPasswordReset({
				body: { email, redirectTo },
			}).catch(() => {
				// Intentionally suppressed — this is fire-and-forget.
				// Errors here (mail outage, config) must not leak response timing
				// or crash the worker.
			});
		}
	} catch {
		// Swallow errors — always return generic response
	}

	await ensureMinDelay();
	return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
