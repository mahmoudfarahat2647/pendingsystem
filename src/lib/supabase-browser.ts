import { createBrowserClient } from "@supabase/ssr";

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
 * Cookie configuration for secure session storage.
 *
 * httpOnly: Browsers cannot set HttpOnly cookies from client-side JS
 * secure: Only sent over HTTPS in production (allows HTTP in development)
 * sameSite: 'lax' - cookies sent for top-level navigation and same-site requests
 * path: '/' - cookies available across entire site
 */
const cookieOptions = {
	httpOnly: false,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
};

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client for client components.
 *
 * Uses cookie-based session storage via @supabase/ssr.
 * Cookies are automatically managed by the browser and accessible to middleware.
 *
 * Security features:
 * - Automatic token refresh
 * - Compatible with Next.js middleware for route protection
 *
 * @example
 * ```tsx
 * import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
 *
 * const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({
 *   email: "user@example.com",
 *   password: "password"
 * });
 * ```
 */
export function getSupabaseBrowserClient() {
	if (typeof window === "undefined") {
		throw new Error(
			"getSupabaseBrowserClient can only be used in client-side code",
		);
	}

	if (!browserClient) {
		browserClient = createBrowserClient(
			supabaseUrl as string,
			supabaseAnonKey as string,
		);
	}

	return browserClient;
}
