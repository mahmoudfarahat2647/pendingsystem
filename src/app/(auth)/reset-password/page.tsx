import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      title="Set new password"
      subtitle="Enter and confirm your new password"
    >
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
