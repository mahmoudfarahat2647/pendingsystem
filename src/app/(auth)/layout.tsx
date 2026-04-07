import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieStore = await cookies();
	const hasSessionCookie =
		cookieStore.has("better-auth.session_token") ||
		cookieStore.has("__Secure-better-auth.session_token");

	if (hasSessionCookie) {
		const session = await getServerSession();
		if (session) redirect("/dashboard");
	}

	return <>{children}</>;
}
