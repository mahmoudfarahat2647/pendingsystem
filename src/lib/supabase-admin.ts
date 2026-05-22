import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with the service role key.
 * Bypasses RLS — server-side use only, never expose to the browser.
 *
 * @param options.fetch - Optional custom fetch (e.g. with a timeout wrapper).
 */
export function createServiceClient(options?: {
	fetch?: typeof globalThis.fetch;
}) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error("Missing Supabase service configuration");
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false },
		...(options?.fetch ? { global: { fetch: options.fetch } } : {}),
	});
}
