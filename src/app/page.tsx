import { redirect } from "next/navigation";

/**
 * Root page that redirects to the dashboard.
 *
 * This ensures users land on the main dashboard.
 */
export default function RootPage() {
	redirect("/dashboard");
}
