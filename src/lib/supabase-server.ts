import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const missing: string[] = [];
	if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
	if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

	throw new Error(
		`Missing Supabase environment variables: ${missing.join(", ")}. Please check your .env.local file.`,
	);
}

/**
 * Creates a server-side Supabase client for Server Components and Route Handlers.
 *
 * This client reads and writes session data via HTTP-only cookies,
 * ensuring secure authentication state management on the server.
 *
 * Security features:
 * - HTTP-only cookies prevent client-side JavaScript access
 * - Automatic session validation on each request
 * - Compatible with Next.js Server Components and API routes
 *
 * Usage:
 * - Server Components: Read session and user data
 * - Route Handlers: Perform authenticated operations
 * - Server Actions: Execute mutations with auth context
 *
 * @example
 * ```tsx
 * import { createClient } from "@/lib/supabase-server";
 *
 * export default async function Page() {
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return <div>Hello {user?.email}</div>;
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

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(supabaseUrl!, supabaseAnonKey!, {
		cookieOptions,
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(
				cookiesToSet: Array<{
					name: string;
					value: string;
					options?: Record<string, unknown>;
				}>,
			) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						const isRemoval = options?.maxAge === 0;
						const sanitizedOptions = (() => {
							if (isRemoval || !options) return options;
							// Strip Max-Age/Expires to force session-only cookies.
							const { maxAge: _maxAge, expires: _expires, ...rest } = options;
							return rest;
						})();
						cookieStore.set(name, value, sanitizedOptions);
					}
				} catch {
					// The `setAll` method was called from a Server Component.
					// This can be ignored if you have middleware refreshing
					// user sessions.
				}
			},
		},
	});
}
