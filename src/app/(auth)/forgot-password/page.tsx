import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
	return (
		<AuthPageShell
			title="Reset password"
			subtitle="Enter your username to receive a reset link"
		>
			<ForgotPasswordForm />
		</AuthPageShell>
	);
}
