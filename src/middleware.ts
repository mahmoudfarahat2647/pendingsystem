import { type NextRequest, NextResponse } from "next/server";

// Standard sliding window rate limiter
class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    isRateLimited(identifier: string, limit: number, windowMs: number): boolean {
        const now = Date.now();
        const timestamps = this.requests.get(identifier) || [];

        // Remove timestamps outside the window
        const validTimestamps = timestamps.filter((t) => now - t < windowMs);

        if (validTimestamps.length >= limit) {
            return true;
        }

        validTimestamps.push(now);
        this.requests.set(identifier, validTimestamps);
        return false;
    }

    getRemainingRequests(
        identifier: string,
        limit: number,
        windowMs: number,
    ): number {
        const now = Date.now();
        const timestamps = this.requests.get(identifier) || [];
        const validTimestamps = timestamps.filter((t) => now - t < windowMs);
        return Math.max(0, limit - validTimestamps.length);
    }

    getResetTimestamp(identifier: string, windowMs: number): number {
        const timestamps = this.requests.get(identifier) || [];
        if (timestamps.length === 0) return Date.now();
        return Math.min(...timestamps) + windowMs;
    }
}

const limiter = new RateLimiter();

// Rate limit configurations
const CONFIGS = {
    BACKUP: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 mins
    DEFAULT: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

export function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (!request.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Identify the client (IP address)
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const path = request.nextUrl.pathname;

    // Determine which config to use
    const config = path.includes("/trigger-backup")
        ? CONFIGS.BACKUP
        : CONFIGS.DEFAULT;

    const identifier = `${ip}:${path.includes("/trigger-backup") ? "backup" : "api"}`;

    if (limiter.isRateLimited(identifier, config.limit, config.windowMs)) {
        const resetTime = limiter.getResetTimestamp(identifier, config.windowMs);
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

        // Return standardized error response for 429
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
    const remaining = limiter.getRemainingRequests(
        identifier,
        config.limit,
        config.windowMs,
    );
    const resetTime = limiter.getResetTimestamp(identifier, config.windowMs);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", config.limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(resetTime / 1000).toString(),
    );

    return response;
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: "/api/:path*",
};
