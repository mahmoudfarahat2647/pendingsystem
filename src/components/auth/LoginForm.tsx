"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	authEyeButtonClass,
	authFieldErrorClass,
	authInputClass,
	authInputWrapClass,
	authLabelClass,
	authLinkClass,
	authSubmitClass,
} from "@/components/auth/authStyles";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { type LoginFormData, LoginFormSchema } from "@/schemas/auth.schema";

interface LoginFormProps {
	expired?: boolean;
}

export function LoginForm({ expired }: LoginFormProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (!("customElements" in window)) return;

		void import("ldrs")
			.then(({ mirage }) => {
				mirage.register();
			})
			.catch(() => {});
	}, []);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(LoginFormSchema),
	});

	useEffect(() => {
		const saved = localStorage.getItem("login-username");
		if (saved) setValue("username", saved);
	}, [setValue]);

	const onSubmit = async (data: LoginFormData) => {
		setError(null);
		const result = await authClient.signIn.username({
			username: data.username,
			password: data.password,
		});
		if (result.error) {
			setError(result.error.message ?? "Invalid username or password");
			return;
		}
		localStorage.setItem("login-username", data.username);
		router.replace("/dashboard");
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{expired && (
				<div
					role="alert"
					className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
				>
					<p className="text-amber-400 text-sm">
						Your session expired. Please sign in again.
					</p>
				</div>
			)}
			<div>
				<label htmlFor="username" className={authLabelClass}>
					Username
				</label>
				<div className={authInputWrapClass}>
					<input
						id="username"
						type="text"
						autoComplete="off"
						className={authInputClass}
						aria-label="Username"
						{...register("username")}
					/>
				</div>
				{errors.username && (
					<p className={authFieldErrorClass}>{errors.username.message}</p>
				)}
			</div>

			<div>
				<label htmlFor="password" className={authLabelClass}>
					Password
				</label>
				<div className={authInputWrapClass}>
					<input
						id="password"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						className={authInputClass}
						aria-label="Password"
						{...register("password")}
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={showPassword ? "Hide password" : "Show password"}
						onClick={() => setShowPassword((v) => !v)}
						className={authEyeButtonClass}
					>
						{showPassword ? (
							<EyeOff size={18} strokeWidth={1.75} />
						) : (
							<Eye size={18} strokeWidth={1.75} />
						)}
					</button>
				</div>
				{errors.password && (
					<p className={authFieldErrorClass}>{errors.password.message}</p>
				)}
			</div>

			{error && (
				<div
					role="alert"
					className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2"
				>
					<p className="text-red-400 text-sm">{error}</p>
				</div>
			)}

			<div className="pt-2">
				<Button
					type="submit"
					disabled={isSubmitting}
					aria-label={isSubmitting ? "Signing in" : undefined}
					className={authSubmitClass}
				>
					{isSubmitting ? (
						<l-mirage size="30" speed="2.5" color="black" />
					) : (
						"Sign In"
					)}
				</Button>
			</div>

			<p className="text-center pt-2">
				<Link href="/forgot-password" className={authLinkClass}>
					Forgot Password?
				</Link>
			</p>
		</form>
	);
}
