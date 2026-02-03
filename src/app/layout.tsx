import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	preload: true,
	adjustFontFallback: true,
});

export const metadata: Metadata = {
	title: "Pending.Sys - Renault Logistics Command Center",
	description: "Logistics Command Center for automotive service centers",
};

/**
 * Root layout providing global providers and dark theme.
 * 
 * Layout structure is handled by route groups:
 * - (auth) - Minimal layout for login/forgot-password
 * - (app) - Full layout with Sidebar/Header for protected pages
 * 
 * This layout only provides:
 * - Dark theme enforcement
 * - React Query provider
 * - Toast notifications
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<body className={inter.className} suppressHydrationWarning>
				<QueryProvider>
					{children}
					<Toaster position="top-right" richColors />
				</QueryProvider>
			</body>
		</html>
	);
}

