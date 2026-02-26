import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Main Sheet | Pending.Sys",
	description:
		"Manage committed inventory lines, update statuses, and route items downstream.",
	alternates: {
		canonical: "/main-sheet",
	},
};

export default function MainSheetLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
