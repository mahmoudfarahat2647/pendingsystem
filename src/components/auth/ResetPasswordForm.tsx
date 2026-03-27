"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
				<p className="text-red-400 text-sm">
					Invalid or missing reset token. Please request a new password reset.
				</p>
			</div>
		);
	}

	if (success) {
		return (
			<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
				<p className="text-green-400 text-sm">
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
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<fieldset className="border border-[#FFCC00]/40 rounded-lg px-2 pb-1.5 pt-0 focus-within:border-[#FFCC00] transition-colors">
				<legend className="text-[#FFCC00] text-[11px] px-1.5 font-medium ml-1 bg-transparent tracking-wide">
					New Password
				</legend>
				<input
					id="newPassword"
					type="password"
					autoComplete="new-password"
					className="w-full bg-transparent text-white text-sm px-2 py-0 h-7 outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:white]"
					{...register("newPassword")}
				/>
			</fieldset>
			{errors.newPassword && (
				<p className="text-red-400 text-xs -mt-4">{errors.newPassword.message}</p>
			)}

			<fieldset className="border border-[#FFCC00]/40 rounded-lg px-2 pb-1.5 pt-0 focus-within:border-[#FFCC00] transition-colors">
				<legend className="text-[#FFCC00] text-[11px] px-1.5 font-medium ml-1 bg-transparent tracking-wide">
					Confirm Password
				</legend>
				<input
					id="confirmPassword"
					type="password"
					autoComplete="new-password"
					className="w-full bg-transparent text-white text-sm px-2 py-0 h-7 outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:white]"
					{...register("confirmPassword")}
				/>
			</fieldset>
			{errors.confirmPassword && (
				<p className="text-red-400 text-xs -mt-4">
					{errors.confirmPassword.message}
				</p>
			)}

			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
					<p className="text-red-400 text-sm">{error}</p>
				</div>
			)}

			<div className="pt-2">
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-bold h-10 rounded-md transition-all active:scale-[0.98]"
				>
					{isSubmitting ? "Resetting..." : "Reset Password"}
				</Button>
			</div>
		</form>
	);
}
