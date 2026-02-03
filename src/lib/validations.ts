import { z } from "zod";

/**
 * The only email address authorized to access the system.
 * This is enforced both client-side (UX) and server-side (security).
 */
export const ALLOWED_USER_EMAIL = "barakat2647@gmail.com";

/**
 * Login form validation schema.
 * Validates email format and password minimum length.
 * Note: Email restriction is for UX only - actual security is enforced server-side.
 */
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Forgot password form validation schema.
 * Validates email format only.
 */
export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
