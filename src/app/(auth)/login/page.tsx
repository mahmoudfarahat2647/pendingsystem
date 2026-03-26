import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
	return (
		<AuthPageShell title="Welcome back" subtitle="Sign in to your account">
			<LoginForm />
		</AuthPageShell>
	);
}
