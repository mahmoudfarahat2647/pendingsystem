import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";

/**
 * Root page that redirects based on session state.
 *
 * Authenticated users land on the dashboard; unauthenticated users go to login.
 */
export default async function RootPage() {
	const session = await getServerSession();
	if (session) {
		redirect("/dashboard");
	}
	redirect("/login");
}
