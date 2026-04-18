import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Quick Order",
	robots: { index: false, follow: false },
};

export default function MobileOrderLayout({
	children,
}: {
	children: ReactNode;
}) {
	return <>{children}</>;
}
