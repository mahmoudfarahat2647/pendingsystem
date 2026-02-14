import { createClient } from "@supabase/supabase-js";

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

let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Browser-side Supabase client for client components.
 *
 * Uses stateless sessions (no persisted session) via @supabase/supabase-js.
 *
 * @example
 * ```tsx
 * import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
 *
 * const { data, error } = await getSupabaseBrowserClient()
 *   .from("orders")
 *   .select("*");
 * ```
 */
export function getSupabaseBrowserClient() {
	if (typeof window === "undefined") {
		throw new Error(
			"getSupabaseBrowserClient can only be used in client-side code",
		);
	}

	if (!browserClient) {
		browserClient = createClient(
			supabaseUrl as string,
			supabaseAnonKey as string,
			{},
		);
	}

	return browserClient;
}
