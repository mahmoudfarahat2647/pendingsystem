import { createClient as createSupabaseJS } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase-browser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables");
}

/**
 * Universal Supabase client that redirects to the appropriate context-specific client.
 *
 * - In the browser: Uses the localStorage-based client from getSupabaseBrowserClient()
 * - On the server: Uses a stateless client (session features disabled) to prevent overlap
 */
export const supabase =
	typeof window !== "undefined"
		? getSupabaseBrowserClient()
		: createSupabaseJS(supabaseUrl, supabaseAnonKey, {});
