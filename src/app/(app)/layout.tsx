import { AppShell } from "@/components/shared/AppShell";

/**
 * App layout for main application routes.
 *
 * This layout provides the shared shell:
 * - Sidebar and header
 * - Error boundaries
 *
 * @param children - Page content to render inside the app shell
 */
export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <AppShell>{children}</AppShell>;
}
