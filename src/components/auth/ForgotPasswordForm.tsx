"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	authFieldErrorClass,
	authInputClass,
	authInputWrapClass,
	authLabelClass,
	authLinkClass,
	authSubmitClass,
} from "@/components/auth/authStyles";
import { Button } from "@/components/ui/button";
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
				<div
					data-testid="forgot-password-success"
					role="alert"
					className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
				>
					<p className="text-green-400 text-sm">
						If that username exists, a reset link has been sent to the
						associated email address.
					</p>
				</div>
				<Link href="/login" className={`block text-center ${authLinkClass}`}>
					Back to login
				</Link>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label htmlFor="username" className={authLabelClass}>
					Username
				</label>
				<div className={authInputWrapClass}>
					<input
						id="username"
						type="text"
						autoComplete="username"
						className={authInputClass}
						aria-label="Username"
						{...register("username")}
					/>
				</div>
				{errors.username && (
					<p className={authFieldErrorClass}>{errors.username.message}</p>
				)}
			</div>

			<div className="pt-1">
				<Button
					type="submit"
					disabled={isSubmitting}
					className={authSubmitClass}
				>
					{isSubmitting ? "Sending..." : "Send Reset Link"}
				</Button>
			</div>

			<p className="text-center">
				<Link href="/login" className={authLinkClass}>
					Back to login
				</Link>
			</p>
		</form>
	);
}
