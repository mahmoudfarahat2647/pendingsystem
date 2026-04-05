import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Paths that don't require authentication
const PUBLIC_PATHS = [
	"/login",
	"/forgot-password",
	"/reset-password",
	"/api/auth",
	"/api/health",
	"/api/password-reset",
];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);
}

/**
 * Security middleware for production hardening.
 *
 * Applies auth redirect logic and security headers to all responses:
 * - X-Frame-Options: DENY
 * - X-Content-Type-Options: nosniff
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Content-Security-Policy (development-friendly: 'unsafe-eval' removed in production)
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Auth redirect logic (optimistic cookie check — no DB calls in Edge)
	// Note: only guards protected routes. Auth pages (login, forgot-password,
	// reset-password) are handled by (auth)/layout.tsx which performs a real
	// DB-validated session check, avoiding redirect loops caused by
	// expired/tampered cookies that pass a presence-only check.
	// Inline cookie check — avoids better-auth/cookies import which transitively
	// pulls in jose (CompressionStream) and breaks Edge Runtime on Vercel.
	const sessionCookie =
		request.cookies.get("better-auth.session_token") ||
		request.cookies.get("__Secure-better-auth.session_token");

	if (!sessionCookie && !isPublicPath(pathname)) {
		// API routes should return 401 JSON, not a browser redirect
		if (pathname.startsWith("/api/")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		// Not authenticated, accessing protected route → redirect to login
		const loginUrl = new URL("/login", request.url);
		return NextResponse.redirect(loginUrl);
	}

	const response = NextResponse.next();

	// Security headers
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), payment=()",
	);

	const isProduction = process.env.NODE_ENV === "production";

	// Content Security Policy
	// In development, 'unsafe-eval' is required for Next.js hot module replacement (HMR)
	// and eval-based source maps. In production, we strip it for stronger XSS protection.
	const scriptSrcBase = isProduction
		? "script-src 'self' 'unsafe-inline' https://*.supabase.co"
		: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co";

	const csp = [
		"default-src 'self'",
		scriptSrcBase,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https: blob:",
		"font-src 'self' data:",
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co",
		"frame-src 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");

	response.headers.set("Content-Security-Policy", csp);

	// HSTS: production only — browsers must not send this over plain HTTP
	if (isProduction) {
		response.headers.set(
			"Strict-Transport-Security",
			"max-age=63072000; includeSubDomains; preload",
		);
	}

	// Remove server header
	response.headers.delete("Server");
	response.headers.delete("X-Powered-By");

	return response;
}

/**
 * Apply middleware to all routes except static files and API health check
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - Public static assets (files with extensions served from /public)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2)$).*)",
	],
};
