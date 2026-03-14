import { createClient as createSupabaseJS } from "@supabase/supabase-js";
import { env } from "./env";
import { getSupabaseBrowserClient } from "./supabase-browser";

export const supabase =
	typeof window !== "undefined"
		? getSupabaseBrowserClient()
		: createSupabaseJS(
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
