"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ALLOWED_USER_EMAIL } from "@/lib/validations";

interface User {
	id: string;
	email: string;
}

/**
 * Authentication hook providing login, logout, and user state management.
 *
 * Security features:
 * - Cookie-based session storage (HTTP-only)
 * - Automatic token refresh
 * - Server-side email validation in middleware
 *
 * @returns Authentication state and methods
 *
 * @example
 * ```tsx
 * const { user, login, logout, isLoading } = useAuth();
 *
 * const handleLogin = async () => {
 *   await login("user@example.com", "password");
 * };
 * ```
 */
export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Check active session on mount
		const checkUser = async () => {
			try {
				const {
					data: { user },
					error,
				} = await getSupabaseBrowserClient().auth.getUser();

				if (error) {
					// If we get a specific token error, clear the session
					if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_grant")) {
						await getSupabaseBrowserClient().auth.signOut();
					}
					setUser(null);
					return;
				}

				setUser(user ? { id: user.id, email: user.email ?? "" } : null);
			} catch (error) {
				console.error("Error checking user:", error);
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		checkUser();

		// Listen for auth state changes
		const {
			data: { subscription },
		} = getSupabaseBrowserClient().auth.onAuthStateChange(
			(_event: any, session: any) => {
				setUser(
					session?.user
						? { id: session.user.id, email: session.user.email ?? "" }
						: null,
				);
			},
		);

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	/**
	 * Authenticates user with email and password.
	 *
	 * Security checks:
	 * 1. Client-side: Validates email format and password length (UX)
	 * 2. Supabase: Verifies credentials against database
	 * 3. Middleware: Validates email matches ALLOWED_USER_EMAIL (security)
	 *
	 * @param email - User email address
	 * @param password - User password
	 * @throws Error if authentication fails
	 */
	const login = async (email: string, password: string) => {
		try {
			setIsLoading(true);

			const { data, error } =
				await getSupabaseBrowserClient().auth.signInWithPassword({
					email,
					password,
				});

			if (error) {
				toast.error(error.message);
				throw error;
			}

			// Additional client-side email check (UX layer)
			if (data.user?.email !== ALLOWED_USER_EMAIL) {
				await getSupabaseBrowserClient().auth.signOut();
				toast.error("Unauthorized email address");
				throw new Error("Unauthorized email address");
			}

			setUser({ id: data.user.id, email: data.user.email ?? "" });

			// Wait for session to sync to cookies before navigating
			// This prevents race conditions with middleware checking auth
			let attempts = 0;
			const maxAttempts = 10;
			while (attempts < maxAttempts) {
				try {
					const { data: sessionData } =
						await getSupabaseBrowserClient().auth.getSession();
					if (sessionData.session) {
						break;
					}
				} catch (e) {
					console.warn("Session sync check failed:", e);
				}
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}

			router.push("/dashboard");
			router.refresh();
		} catch (error) {
			console.error("Login error:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Signs out the current user and clears session.
	 *
	 * Security actions:
	 * - Clears HTTP-only session cookies
	 * - Invalidates refresh token
	 * - Redirects to login page
	 */
	const logout = async () => {
		try {
			setIsLoading(true);
			await getSupabaseBrowserClient().auth.signOut();
			setUser(null);
			router.push("/login");
			router.refresh();
		} catch (error) {
			console.error("Logout error:", error);
			toast.error("Failed to logout");
		} finally {
			setIsLoading(false);
		}
	};

	return {
		user,
		login,
		logout,
		isLoading,
	};
}
