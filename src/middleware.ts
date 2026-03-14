import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Security middleware for production hardening.
 *
 * Applies security headers to all responses:
 * - X-Frame-Options: DENY
 * - X-Content-Type-Options: nosniff
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Content-Security-Policy (development-friendly)
 */
export function middleware(request: NextRequest) {
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

	// Content Security Policy - strict but allows necessary sources
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
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
		 * - public folder files
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*..*$).*)",
	],
};
