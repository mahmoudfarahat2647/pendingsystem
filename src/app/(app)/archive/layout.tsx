import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Archive | Pending.Sys",
	description:
		"Review archived lines, update details, send reorders, and remove obsolete records.",
	alternates: {
		canonical: "/archive",
	},
};

export default function ArchiveLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
