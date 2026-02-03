import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const missing: string[] = [];
	if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
	if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

	throw new Error(
		`Missing Supabase environment variables: ${missing.join(", ")}. Please check your Vercel Project Settings (or .env.local if running locally).`,
	);
}

/**
 * Supabase client with connection pooling via Supavisor.
 * 
 * Connection pooling is automatically handled by Supabase's infrastructure.
 * For serverless environments, Supabase uses transaction mode pooling.
 * 
 * Best practices:
 * - Batch large operations to avoid overwhelming the pool
 * - Use pagination for bulk queries
 * - Monitor connection usage in Supabase dashboard
 */
const isBrowser = typeof window !== "undefined";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: isBrowser,
		detectSessionInUrl: isBrowser,
		storage: {
			getItem: (key) => {
				if (isBrowser) {
					return localStorage.getItem(key);
				}
				return null;
			},
			setItem: (key, value) => {
				if (isBrowser) {
					localStorage.setItem(key, value);
				}
			},
			removeItem: (key) => {
				if (isBrowser) {
					localStorage.removeItem(key);
				}
			},
		},
	},
	db: {
		schema: "public",
	},
	global: {
		headers: {
			"x-application-name": "pendingsystem",
		},
	},
});
