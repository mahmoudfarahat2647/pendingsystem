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
		try {
			await fetch("/api/password-reset/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: data.username }),
			});
		} catch {
			// Swallow errors — always show success (enumeration prevention)
		}
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
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<fieldset className="border border-[#FFCC00]/40 rounded-lg px-2 pb-1.5 pt-0 focus-within:border-[#FFCC00] transition-colors">
				<legend className="text-[#FFCC00] text-[11px] px-1.5 font-medium ml-1 bg-transparent tracking-wide">
					Username
				</legend>
				<input
					id="username"
					type="text"
					autoComplete="username"
					className="w-full bg-transparent text-white text-sm px-2 py-0 h-7 outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:white]"
					{...register("username")}
				/>
			</fieldset>
			{errors.username && (
				<p className="text-red-400 text-xs -mt-4">{errors.username.message}</p>
			)}

			<div className="pt-2">
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-bold h-10 rounded-md transition-all active:scale-[0.98]"
				>
					{isSubmitting ? "Sending..." : "Send Reset Link"}
				</Button>
			</div>

			<p className="text-center text-sm pt-4">
				<Link
					href="/login"
					className="text-[#FFCC00] hover:text-[#FFCC00]/80 transition-colors"
				>
					Back to login
				</Link>
			</p>
		</form>
	);
}
