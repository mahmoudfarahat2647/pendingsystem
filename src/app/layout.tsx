import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemedToaster } from "@/components/providers/ThemedToaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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
const arabicFont = localFont({
	src: [
		{
			path: "../assets/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2",
			weight: "400",
		},
		{
			path: "../assets/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2",
			weight: "500",
		},
		{
			path: "../assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2",
			weight: "700",
		},
	],
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
 * - Dark default + saved-theme pre-paint script
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
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static constant, no user input; must run before first paint */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
			</head>
			<body
				className={`font-sans ${arabicFont.variable}`}
				suppressHydrationWarning
			>
				<QueryProvider>
					{children}
					<ThemedToaster />
				</QueryProvider>
			</body>
		</html>
	);
}
