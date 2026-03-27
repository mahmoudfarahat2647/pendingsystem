import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";
import { getServerSession } from "@/lib/auth-session";

/**
 * App layout for main application routes.
 *
 * This layout provides the shared shell:
 * - Sidebar and header
 * - Error boundaries
 *
 * @param children - Page content to render inside the app shell
 */
export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession();
	if (!session) {
		redirect("/login");
	}
	return <AppShell>{children}</AppShell>;
}
