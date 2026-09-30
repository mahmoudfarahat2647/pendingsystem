import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
	searchParams: Promise<{ expired?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const params = await searchParams;
	return (
		<AuthPageShell title="Welcome back" subtitle="Sign in to your workspace.">
			<LoginForm expired={params.expired === "1"} />
		</AuthPageShell>
	);
}
