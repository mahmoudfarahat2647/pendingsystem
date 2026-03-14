/**
 * Simple in-memory rate limiter for API routes.
 * Note: For production, consider using Redis for distributed rate limiting.
 *
 * Usage:
 * import { rateLimit } from '@/lib/rateLimit';
 *
 * export async function GET(request: Request) {
 *   const { success } = rateLimit(request);
 *   if (!success) {
 *     return Response.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *   // ... handler logic
 * }
 */

interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

// In-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of requestCounts.entries()) {
		if (value.resetTime < now) {
			requestCounts.delete(key);
		}
	}
}, 60000); // Clean every minute

/**
 * Get rate limit config based on environment
 */
function getRateLimitConfig(): RateLimitConfig {
	// Stricter limits in production
	if (process.env.NODE_ENV === "production") {
		return {
			windowMs: 60 * 1000, // 1 minute
			maxRequests: 100, // 100 requests per minute
		};
	}

	return {
		windowMs: 60 * 1000,
		maxRequests: 1000, // More lenient in development
	};
}

/**
 * Extract client identifier from request
 * Uses IP address or a combination of headers
 */
function getClientIdentifier(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

	// Also include user agent for better tracking
	const userAgent = request.headers.get("user-agent") || "unknown";

	// Create a simple hash
	return `${ip}-${userAgent.slice(0, 50)}`;
}

/**
 * Check if the request should be rate limited
 */
export function rateLimit(request: Request): RateLimitResult {
	const config = getRateLimitConfig();
	const identifier = getClientIdentifier(request);
	const now = Date.now();

	let record = requestCounts.get(identifier);

	if (!record || record.resetTime < now) {
		// New window
		record = {
			count: 1,
			resetTime: now + config.windowMs,
		};
		requestCounts.set(identifier, record);

		return {
			success: true,
			limit: config.maxRequests,
			remaining: config.maxRequests - 1,
			reset: record.resetTime,
		};
	}

	// Increment counter
	record.count++;
	requestCounts.set(identifier, record);

	const remaining = Math.max(0, config.maxRequests - record.count);

	return {
		success: record.count <= config.maxRequests,
		limit: config.maxRequests,
		remaining,
		reset: record.resetTime,
	};
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
	response: Response,
	result: RateLimitResult,
): Response {
	response.headers.set("X-RateLimit-Limit", String(result.limit));
	response.headers.set("X-RateLimit-Remaining", String(result.remaining));
	response.headers.set("X-RateLimit-Reset", String(result.reset));

	return response;
}
