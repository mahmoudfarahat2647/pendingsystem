"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClientErrorBoundary } from "@/components/shared/ClientErrorBoundary";
import { Header } from "@/components/shared/Header";
import { MainContentWrapper } from "@/components/shared/MainContentWrapper";
import { Sidebar } from "@/components/shared/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

interface User {
	id: string;
	email: string;
}

interface AppShellProps {
	children: React.ReactNode;
	initialUser: User;
}

/**
 * Client-side app shell with navigation, idle timeout, and error handling.
 *
 * This component receives the authenticated user from the server layout
 * and maintains the UI state including:
 * - Sidebar and header navigation
 * - Auto-logout after 4 hours of inactivity
 * - Error boundaries
 *
 * @param children - Page content
 * @param initialUser - Authenticated user from server-side session
 */
export function AppShell({ children, initialUser }: AppShellProps) {
	const router = useRouter();
	const { logout } = useAuth();

	// Client-side logout safeguard (redirects if session lost)
	useEffect(() => {
		if (!initialUser) {
			router.replace("/login");
		}
	}, [initialUser, router]);

	// Auto-logout after 4 hours of inactivity
	useIdleTimeout(
		() => {
			logout();
		},
		4 * 60 * 60 * 1000,
	); // 4 hours

	if (!initialUser) return null;

	return (
		<div
			className="flex h-screen overflow-hidden bg-background"
			suppressHydrationWarning
		>
			<Sidebar />
			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />
				<main className="flex-1 overflow-y-auto p-6">
					<MainContentWrapper>
						<ClientErrorBoundary fallbackTitle="Page Error">
							{children}
						</ClientErrorBoundary>
					</MainContentWrapper>
				</main>
			</div>
		</div>
	);
}
