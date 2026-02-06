"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { isAllowedEmail } from "@/lib/validations";

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
				const response = await fetch("/api/auth/user", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					setUser(null);
					return;
				}

				const payload = (await response.json()) as { user?: User | null };
				setUser(payload.user ?? null);
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
			const normalizedEmail = email.trim();

			console.log("[useAuth] ===== LOGIN START =====");
			console.log("[useAuth] Starting login for:", normalizedEmail);
			console.log("[useAuth] Password length:", password.length);
			setIsLoading(true);

			console.log("[useAuth] Calling /api/auth/login...");
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: normalizedEmail, password }),
			});

			if (!response.ok) {
				const errorPayload = await response.json().catch(() => null);
				const message = errorPayload?.error ?? "Login failed.";
				console.error("[useAuth] Login API error:", message);
				toast.error(message);
				throw new Error(message);
			}

			const payload = (await response.json()) as { user?: User | null };
			const user = payload.user;

			if (!user || !isAllowedEmail(user.email)) {
				toast.error("Unauthorized email address");
				throw new Error("Unauthorized email address");
			}

			console.log("[useAuth] Login success, setting user state...");
			setUser(user);
			console.log("[useAuth] Redirecting to dashboard...");
			console.log("[useAuth] Calling router.push('/dashboard')...");

			router.replace("/dashboard");
			console.log("[useAuth] Calling router.refresh()...");
			router.refresh();
			console.log("[useAuth] ===== LOGIN END =====");
		} catch (error) {
			console.error("[useAuth] ===== LOGIN ERROR =====");
			console.error("[useAuth] Login error:", error);
			console.error("[useAuth] Error type:", error instanceof Error ? error.constructor.name : typeof error);
			if (error instanceof Error) {
				console.error("[useAuth] Error message:", error.message);
				console.error("[useAuth] Error stack:", error.stack);
			}
			console.error("[useAuth] ===== END ERROR =====");
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
			await fetch("/api/auth/logout", { method: "POST" });
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
