import { type NextRequest, NextResponse } from "next/server";

interface RateLimitState {
	timestamps: number[];
	blockedUntil?: number;
}

/**
 * Robust in-memory rate limiter with deterministic lazy cleanup.
 * Mitigates High Risk #4 for single-instance deployments.
 */
class RateLimiter {
	private readonly requests: Map<string, RateLimitState> = new Map();
	private lastCleanup = Date.now();
	private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

	/**
	 * Checks if a request should be rate limited.
	 * Performs lazy cleanup if the cleanup interval has passed.
	 */
	check(
		identifier: string,
		limit: number,
		windowMs: number,
	): {
		limited: boolean;
		remaining: number;
		resetTime: number;
	} {
		const now = Date.now();

		// Greedy/Lazy cleanup: Prune old entries every CLEANUP_INTERVAL
		if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
			this.cleanup(now);
		}

		const state = this.requests.get(identifier) || { timestamps: [] };

		// Check if explicitly blocked
		if (state.blockedUntil && now < state.blockedUntil) {
			return {
				limited: true,
				remaining: 0,
				resetTime: state.blockedUntil,
			};
		}

		// Remove timestamps outside the window
		const validTimestamps = state.timestamps.filter((t) => now - t < windowMs);

		if (validTimestamps.length >= limit) {
			const resetTime = Math.min(...validTimestamps) + windowMs;
			state.blockedUntil = resetTime;
			state.timestamps = validTimestamps;
			this.requests.set(identifier, state);

			return {
				limited: true,
				remaining: 0,
				resetTime,
			};
		}

		validTimestamps.push(now);
		this.requests.set(identifier, { timestamps: validTimestamps });

		return {
			limited: false,
			remaining: Math.max(0, limit - validTimestamps.length),
			resetTime: validTimestamps[0] + windowMs,
		};
	}

	private cleanup(now: number) {
		const maxWindow = 15 * 60 * 1000; // Keep the largest known window in mind (BACKUP window)
		for (const [key, state] of this.requests.entries()) {
			const hasRecentActivity = state.timestamps.some(
				(t) => now - t < maxWindow,
			);
			const isStillBlocked = state.blockedUntil && now < state.blockedUntil;

			if (!hasRecentActivity && !isStillBlocked) {
				this.requests.delete(key);
			}
		}
		this.lastCleanup = now;
	}
}

const limiter = new RateLimiter();

// Rate limit configurations
const CONFIGS = {
	BACKUP: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 mins (stricter for sensitive endpoints)
	DEFAULT: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

/**
 * Next.js middleware providing API rate limiting:
 * - Applied only to /api routes via matcher
 * - Rate limited by IP address (x-forwarded-for > req.ip > unknown)
 * - Returns 429 with Retry-After and rate-limit headers
 */
export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;

	// Skip if not an API route (though matcher should handle this)
	if (!path.startsWith("/api")) {
		return NextResponse.next();
	}

	// Identify the client with robust IP fallback
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
		(request as any).ip ||
		"unknown";

	// Determine bucket and config
	const isBackup = path.includes("/trigger-backup");
	const config = isBackup ? CONFIGS.BACKUP : CONFIGS.DEFAULT;
	const identifier = `${isBackup ? "backup" : "api"}:${ip}`;

	const { limited, remaining, resetTime } = limiter.check(
		identifier,
		config.limit,
		config.windowMs,
	);

	if (limited) {
		const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

		return new NextResponse(
			JSON.stringify({
				success: false,
				error: {
					code: "RATE_LIMIT_EXCEEDED",
					message: "Too many requests. Please try again later.",
					details: {
						retryAfterSeconds: retryAfter,
					},
				},
			}),
			{
				status: 429,
				headers: {
					"Content-Type": "application/json",
					"X-RateLimit-Limit": config.limit.toString(),
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
					"Retry-After": retryAfter.toString(),
				},
			},
		);
	}

	const response = NextResponse.next();

	// Add rate limit headers to successful responses
	response.headers.set("X-RateLimit-Limit", config.limit.toString());
	response.headers.set("X-RateLimit-Remaining", remaining.toString());
	response.headers.set(
		"X-RateLimit-Reset",
		Math.ceil(resetTime / 1000).toString(),
	);

	return response;
}

// Scoped to API routes only to prevent unnecessary execution
export const config = {
	matcher: ["/api/:path*"],
};
