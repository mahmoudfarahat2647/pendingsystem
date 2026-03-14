import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
	if (typeof window === "undefined") {
		throw new Error(
			"getSupabaseBrowserClient can only be used in client-side code",
		);
	}

	if (!browserClient) {
		browserClient = createClient(
			env.NEXT_PUBLIC_SUPABASE_URL,
			env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false,
					detectSessionInUrl: false,
				},
			},
		);
	}

	return browserClient;
}
