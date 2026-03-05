import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "@/components/providers/QueryProvider";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const metadataBase = (() => {
	try {
		return new URL(APP_URL);
	} catch {
		return new URL("http://localhost:3000");
	}
})();



export const metadata: Metadata = {
	metadataBase,
	title: "Pending.Sys - pendingsystem Logistics Command Center",
	description: "Logistics Command Center for automotive service centers",
	alternates: {
		canonical: "/",
	},
	icons: {
		icon: "/favicon.svg",
	},
};

/**
 * Root layout providing global providers and dark theme.
 *
 * Layout structure is handled by route groups:
 * - (app) - Full layout with Sidebar/Header for application pages
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
			<body className="font-sans" suppressHydrationWarning>
				<QueryProvider>
					{children}
					<Toaster position="top-right" richColors />
				</QueryProvider>
			</body>
		</html>
	);
}
