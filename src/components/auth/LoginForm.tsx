"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { type LoginFormData, LoginFormSchema } from "@/schemas/auth.schema";

export function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(LoginFormSchema),
	});

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
		router.replace("/dashboard");
	};

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

			<div className="space-y-2">
				<Label htmlFor="password" className="text-gray-300 text-sm">
					Password
				</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					placeholder="Enter your password"
					className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFCC00]/50 focus:ring-[#FFCC00]/20"
					{...register("password")}
				/>
				{errors.password && (
					<p className="text-red-400 text-xs">{errors.password.message}</p>
				)}
			</div>

			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
					<p className="text-red-400 text-sm">{error}</p>
				</div>
			)}

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-bold h-11"
			>
				{isSubmitting ? "Signing in..." : "Sign In"}
			</Button>

			<p className="text-center text-sm text-gray-500">
				<Link
					href="/forgot-password"
					className="text-[#FFCC00]/80 hover:text-[#FFCC00] transition-colors"
				>
					Forgot your password?
				</Link>
			</p>
		</form>
	);
}
