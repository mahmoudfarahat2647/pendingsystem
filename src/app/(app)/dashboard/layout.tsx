import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard | Pending.Sys",
	description:
		"Overview of logistics operations, queue health, and workload trends.",
	alternates: {
		canonical: "/dashboard",
	},
};

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
