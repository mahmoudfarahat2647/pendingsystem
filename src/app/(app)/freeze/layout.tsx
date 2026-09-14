import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Freeze | Pending.Sys",
	description: "Review frozen orders and lines.",
	alternates: {
		canonical: "/freeze",
	},
};

export default function FreezeLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
