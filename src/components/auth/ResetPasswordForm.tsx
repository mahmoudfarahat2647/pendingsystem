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
  ResetPasswordFormSchema,
  type ResetPasswordFormData,
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
      setError(result.error.message ?? "Reset failed. The link may have expired.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.replace("/login"), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-gray-300 text-sm">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Enter new password"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFCC00]/50 focus:ring-[#FFCC00]/20"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-red-400 text-xs">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#FFCC00]/50 focus:ring-[#FFCC00]/20"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>
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
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
