import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client specifically for Next.js middleware (Edge Runtime).
 *
 * This client handles session validation and cookie management in the middleware layer,
 * enabling route protection before requests reach Server Components.
 *
 * Key differences from server client:
 * - Runs in Edge Runtime (not Node.js)
 * - Uses NextResponse for cookie manipulation
 * - Optimized for low-latency session checks
 *
 * Security role:
 * - Validates session cookies on every request
 * - Refreshes expired tokens automatically
 * - Blocks unauthorized access before page rendering
 *
 * @param request - The incoming Next.js request object
 * @returns Tuple of [supabase client, response object]
 *
 * @example
 * ```ts
 * import { createClient } from "@/lib/supabase-middleware";
 *
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createClient(request);
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   if (!user) {
 *     return NextResponse.redirect(new URL("/login", request.url));
 *   }
 *
 *   return response;
 * }
 * ```
 */
/**
 * Cookie configuration for secure session storage.
 *
 * httpOnly: Prevents XSS attacks by making cookies inaccessible to JavaScript
 * secure: Only sent over HTTPS in production (allows HTTP in development)
 * sameSite: 'lax' - cookies sent for top-level navigation and same-site requests
 * path: '/' - cookies available across entire site
 */
const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
	// Session-only cookies (no maxAge/expires)
	maxAge: undefined,
	expires: undefined,
};

export function createClient(request: NextRequest) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Missing Supabase environment variables");
	}

	const response = NextResponse.next({
		request,
	});

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookieOptions,
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					request.cookies.set(name, value);
					const isRemoval = options?.maxAge === 0;
					const sanitizedOptions = (() => {
						if (isRemoval || !options) return options;
						// Strip Max-Age/Expires to force session-only cookies.
						const { maxAge: _maxAge, expires: _expires, ...rest } = options;
						return rest;
					})();
					response.cookies.set(name, value, sanitizedOptions);
				}
			},
		},
	});

	return { supabase, response };
}
