"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

		void import("ldrs").then(({ mirage }) => {
			mirage.register();
		});
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
			<fieldset className="border border-[#FFCC00]/40 rounded-lg px-2 pb-1.5 pt-0 focus-within:border-[#FFCC00] transition-colors">
				<legend className="text-[#FFCC00] text-[11px] px-1.5 font-medium ml-1 bg-transparent tracking-wide">
					Username
				</legend>
				<input
					id="username"
					type="text"
					autoComplete="off"
					className="w-full bg-transparent text-white text-sm px-2 py-0 h-7 outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:white]"
					aria-label="Username"
					{...register("username")}
				/>
			</fieldset>
			{errors.username && (
				<p className="text-red-400 text-xs -mt-4">{errors.username.message}</p>
			)}

			<fieldset className="border border-[#FFCC00]/40 rounded-lg px-2 pb-1.5 pt-0 focus-within:border-[#FFCC00] transition-colors">
				<legend className="text-[#FFCC00] text-[11px] px-1.5 font-medium ml-1 bg-transparent tracking-wide">
					Password
				</legend>
				<div className="flex items-center">
					<input
						id="password"
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						className="w-full bg-transparent text-white text-sm px-2 py-0 h-7 outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:white]"
						aria-label="Password"
						{...register("password")}
					/>
					<button
						type="button"
						tabIndex={-1}
						aria-label={showPassword ? "Hide password" : "Show password"}
						onClick={() => setShowPassword((v) => !v)}
						className="flex-shrink-0 flex items-center p-1 bg-transparent border-none cursor-pointer text-[#FFCC00]/35 hover:text-[#FFCC00] transition-colors duration-150 outline-none"
					>
						{showPassword ? (
							<EyeOff size={16} strokeWidth={1.75} />
						) : (
							<Eye size={16} strokeWidth={1.75} />
						)}
					</button>
				</div>
			</fieldset>
			{errors.password && (
				<p className="text-red-400 text-xs -mt-4">{errors.password.message}</p>
			)}

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
					className="w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-bold h-10 rounded-md transition-all active:scale-[0.98]"
				>
					{isSubmitting ? (
						<l-mirage size="30" speed="2.5" color="black" />
					) : (
						"Sign In"
					)}
				</Button>
			</div>

			<p className="text-center text-sm pt-4">
				<Link
					href="/forgot-password"
					className="text-[#FFCC00] hover:text-[#FFCC00]/80 transition-colors"
				>
					Forgot Password?
				</Link>
			</p>
		</form>
	);
}
