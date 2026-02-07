"use client";

import { ClientErrorBoundary } from "@/components/shared/ClientErrorBoundary";
import { Header } from "@/components/shared/Header";
import { MainContentWrapper } from "@/components/shared/MainContentWrapper";
import { Sidebar } from "@/components/shared/Sidebar";

interface AppShellProps {
	children: React.ReactNode;
}

/**
 * Client-side app shell with navigation and error handling.
 *
 * This component maintains the UI shell including:
 * - Sidebar and header navigation
 * - Error boundaries
 *
 * @param children - Page content
 */
export function AppShell({ children }: AppShellProps) {
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
