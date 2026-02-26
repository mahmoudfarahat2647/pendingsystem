import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Booking | Pending.Sys",
	description:
		"Schedule customer visits, update booking status, and maintain service history.",
	alternates: {
		canonical: "/booking",
	},
};

export default function BookingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
