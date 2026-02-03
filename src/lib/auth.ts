import { createClient } from "./supabase-server";
import { ALLOWED_USER_EMAIL } from "./validations";

/**
 * Result type for authentication checks.
 */
export interface AuthResult {
	success: boolean;
	supabase?: Awaited<ReturnType<typeof createClient>>;
	error?: { status: number; message: string };
}

/**
 * Helper to require an authenticated and authorized user in API routes.
 *
 * This validates:
 * 1. User has a valid session (via cookies)
 * 2. User email matches ALLOWED_USER_EMAIL
 *
 * Security:
 * - Uses HTTP-only cookies for session validation
 * - Enforces single-user access control
 * - Should be called at the start of every protected API route
 *
 * @returns AuthResult with supabase client if authenticated, error otherwise
 *
 * @example
 * ```ts
 * import { requireAllowedUser } from "@/lib/auth";
 *
 * export async function POST() {
 *   const auth = await requireAllowedUser();
 *   if (!auth.success) {
 *     return new Response(
 *       JSON.stringify({ success: false, error: auth.error?.message }),
 *       { status: auth.error?.status, headers: { "Content-Type": "application/json" } }
 *     );
 *   }
 *   // User is authenticated, proceed with protected logic
 * }
 * ```
 */
export async function requireAllowedUser(): Promise<AuthResult> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// No session
	if (!user) {
		return {
			success: false,
			error: { status: 401, message: "Unauthorized" },
		};
	}

	// Wrong user
	if (user.email !== ALLOWED_USER_EMAIL) {
		await supabase.auth.signOut();
		return {
			success: false,
			error: { status: 403, message: "Forbidden" },
		};
	}

	return { success: true, supabase };
}

/**
 * Type for user object returned by auth checks.
 */
export interface AuthenticatedUser {
	id: string;
	email: string;
}

/**
 * Gets the current authenticated user from cookies.
 * Returns null if not authenticated.
 *
 * @returns User object or null
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user || user.email !== ALLOWED_USER_EMAIL) {
		return null;
	}

	return {
		id: user.id,
		email: user.email,
	};
}
