import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

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
 * Arabic font for translated text only. Applied via the `font-arabic`
 * utility inside scoped translation containers — never globally — so the
 * page layout stays LTR and pixel-identical in both languages.
 */
const arabicFont = IBM_Plex_Sans_Arabic({
	subsets: ["arabic"],
	weight: ["400", "500", "700"],
	variable: "--font-arabic",
	display: "swap",
});

/**
 * Root layout providing global providers and dark theme.
 *
 * NOTE: `<html lang="en">` stays unchanged with no global `dir`.
 * Arabic text blocks get `lang="ar" dir="rtl"` on their own scoped
 * containers instead (see `LocalizedScope`).
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
			<body
				className={`font-sans ${arabicFont.variable}`}
				suppressHydrationWarning
			>
				<QueryProvider>
					{children}
					<Toaster position="bottom-right" richColors />
				</QueryProvider>
			</body>
		</html>
	);
}
