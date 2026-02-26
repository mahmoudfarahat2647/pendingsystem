import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Orders | Pending.Sys",
	description: "Create, edit, and track incoming parts orders before commit.",
	alternates: {
		canonical: "/orders",
	},
};

export default function OrdersLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
