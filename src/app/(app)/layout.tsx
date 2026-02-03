import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/AppShell";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server-side protected layout with authentication check.
 *
 * This layout validates the session server-side before rendering:
 * - Reads session from HTTP-only cookies
 * - Redirects to /login if not authenticated
 * - Enforces single-user email restriction
 * - Passes authenticated user to client AppShell
 *
 * Security benefits of server-side validation:
 * - No flash of unauthenticated content
 * - Session validated before any client code runs
 * - Consistent with middleware protection
 *
 * @param children - Page content to render inside the protected layout
 */
export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Server-side auth check via cookies
	const user = await getCurrentUser();

	// Redirect to login if not authenticated
	if (!user) {
		redirect("/login");
	}

	// Render client AppShell with authenticated user
	return <AppShell initialUser={user}>{children}</AppShell>;
}
