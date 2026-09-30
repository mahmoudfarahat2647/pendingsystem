"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	authEyeButtonClass,
	authFieldErrorClass,
	authInputClass,
	authInputWrapClass,
	authLabelClass,
	authSubmitClass,
} from "@/components/auth/authStyles";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
	type ResetPasswordFormData,
	ResetPasswordFormSchema,
} from "@/schemas/auth.schema";

export function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(ResetPasswordFormSchema),
	});

	if (!token) {
		return (
			<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
				<p className="text-red-600 dark:text-red-400 text-sm">
					Invalid or missing reset token. Please request a new password reset.
				</p>
			</div>
		);
	}

	if (success) {
		return (
			<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
				<p className="text-green-700 dark:text-green-400 text-sm">
					Password reset successful. Redirecting to login...
				</p>
			</div>
		);
	}

	const onSubmit = async (data: ResetPasswordFormData) => {
		setError(null);
		const result = await authClient.resetPassword({
			newPassword: data.newPassword,
			token,
		});
		if (result.error) {
			setError(
				result.error.message ?? "Reset failed. The link may have expired.",
			);
			return;
		}
		setSuccess(true);
		setTimeout(() => router.replace("/login"), 2000);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label htmlFor="newPassword" className={authLabelClass}>
					New Password
				</label>
				<div className={authInputWrapClass}>
					<input
						id="newPassword"
						type={showNewPassword ? "text" : "password"}
						autoComplete="new-password"
						className={authInputClass}
						{...register("newPassword")}
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={showNewPassword ? "Hide password" : "Show password"}
						onClick={() => setShowNewPassword((v) => !v)}
						className={authEyeButtonClass}
					>
						{showNewPassword ? (
							<EyeOff size={16} strokeWidth={1.75} />
						) : (
							<Eye size={16} strokeWidth={1.75} />
						)}
					</button>
				</div>
				{errors.newPassword && (
					<p className={authFieldErrorClass}>{errors.newPassword.message}</p>
				)}
			</div>

			<div>
				<label htmlFor="confirmPassword" className={authLabelClass}>
					Confirm Password
				</label>
				<div className={authInputWrapClass}>
					<input
						id="confirmPassword"
						type={showConfirmPassword ? "text" : "password"}
						autoComplete="new-password"
						className={authInputClass}
						{...register("confirmPassword")}
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={showConfirmPassword ? "Hide password" : "Show password"}
						onClick={() => setShowConfirmPassword((v) => !v)}
						className={authEyeButtonClass}
					>
						{showConfirmPassword ? (
							<EyeOff size={16} strokeWidth={1.75} />
						) : (
							<Eye size={16} strokeWidth={1.75} />
						)}
					</button>
				</div>
				{errors.confirmPassword && (
					<p className={authFieldErrorClass}>
						{errors.confirmPassword.message}
					</p>
				)}
			</div>

			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
					<p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
				</div>
			)}

			<div className="pt-1">
				<Button
					type="submit"
					disabled={isSubmitting}
					className={authSubmitClass}
				>
					{isSubmitting ? "Resetting..." : "Reset Password"}
				</Button>
			</div>
		</form>
	);
}
