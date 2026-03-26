"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type ForgotPasswordFormData,
	ForgotPasswordFormSchema,
} from "@/schemas/auth.schema";

export function ForgotPasswordForm() {
	const [submitted, setSubmitted] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(ForgotPasswordFormSchema),
	});

	const onSubmit = async (data: ForgotPasswordFormData) => {
		await fetch("/api/password-reset/request", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: data.username }),
		});
		// Always show success regardless of outcome (enumeration prevention)
		setSubmitted(true);
	};

	if (submitted) {
		return (
			<div className="space-y-4">
				<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
					<p className="text-green-400 text-sm">
						If that username exists, a reset link has been sent to the
						associated email address.
					</p>
				</div>
				<Link
					href="/login"
					className="block text-center text-sm text-[#FFCC00]/80 hover:text-[#FFCC00] transition-colors"
				>
					Back to login
				</Link>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
			<div className="space-y-2">
				<Label htmlFor="username" className="text-gray-300 text-sm">
					Username
				</Label>
				<Input
					id="username"
					type="text"
					autoComplete="username"
					placeholder="Enter your username"
					className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFCC00]/50 focus:ring-[#FFCC00]/20"
					{...register("username")}
				/>
				{errors.username && (
					<p className="text-red-400 text-xs">{errors.username.message}</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-bold h-11"
			>
				{isSubmitting ? "Sending..." : "Send Reset Link"}
			</Button>

			<p className="text-center text-sm text-gray-500">
				<Link
					href="/login"
					className="text-[#FFCC00]/80 hover:text-[#FFCC00] transition-colors"
				>
					Back to login
				</Link>
			</p>
		</form>
	);
}
