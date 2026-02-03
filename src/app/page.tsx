import { redirect } from "next/navigation";

/**
 * Root page that redirects to the dashboard.
 * 
 * This ensures users land on the main dashboard after authentication.
 * The middleware will handle redirecting unauthenticated users to /login.
 */
export default function RootPage() {
	redirect("/dashboard");
}

