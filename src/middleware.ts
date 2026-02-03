import { createClient } from "@/lib/supabase-middleware";
import { ALLOWED_USER_EMAIL } from "@/lib/validations";
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

/**
 * Next.js middleware providing two-layer security:
 * 1. Authentication: Session validation and email verification
 * 2. Rate limiting: API request throttling
 *
 * Authentication flow:
 * - Public routes (login, forgot-password, static assets) bypass auth
 * - Protected routes require valid session cookie
 * - User email must match ALLOWED_USER_EMAIL
 * - Invalid sessions redirect to /login
 *
 * Rate limiting flow:
 * - API routes are rate limited by IP address
 * - Different limits for backup vs general API routes
 * - Returns 429 with retry-after headers when exceeded
 *
 * @param request - Incoming Next.js request
 * @returns Response with auth redirect or rate limit headers
 */
export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // ========================================
    // AUTHENTICATION LAYER
    // ========================================

    // Public routes that don't require authentication
    const publicPaths = ["/login", "/forgot-password"];
    const isPublicPath = publicPaths.some(p => path.startsWith(p));

    const isAsset =
        path.startsWith("/_next/") ||
        path.startsWith("/static/") ||
        path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/);

    if (!isPublicPath && !isAsset) {
        // Create Supabase client for middleware
        const { supabase, response } = createClient(request);

        // Validate session
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // No session - redirect to login
        if (!user) {
            // [CRITICAL] Don't redirect API calls, send 401 instead
            if (path.startsWith("/api/")) {
                return new NextResponse(
                    JSON.stringify({ success: false, error: "Unauthorized" }),
                    { status: 401, headers: { "Content-Type": "application/json" } }
                );
            }
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Session exists but email doesn't match allowed user
        if (user.email !== ALLOWED_USER_EMAIL) {
            await supabase.auth.signOut();
            if (path.startsWith("/api/")) {
                return new NextResponse(
                    JSON.stringify({ success: false, error: "Forbidden" }),
                    { status: 403, headers: { "Content-Type": "application/json" } }
                );
            }
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Valid session - continue with response (syncs cookies)
        return response;
    }

    // ========================================
    // RATE LIMITING LAYER (API routes only)
    // ========================================

    if (!path.startsWith("/api")) {
        return NextResponse.next();
    }

    // Identify the client (IP address)
    const ip =
        (request as any).ip ||
        request.headers.get("x-forwarded-for") ||
        "unknown";

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

// Match all routes except Next.js internals
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
