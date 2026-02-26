import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Call List | Pending.Sys",
	description:
		"Coordinate customer call queues, confirmations, and handoff to booking.",
	alternates: {
		canonical: "/call-list",
	},
};

export default function CallListLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
