import { z } from "zod";

export const LoginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

export const ForgotPasswordFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordFormSchema>;

export const ResetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>;
