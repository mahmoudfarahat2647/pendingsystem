import { z } from "zod";

/**
 * The only email address authorized to access the system.
 * This is enforced both client-side (UX) and server-side (security).
 */
export const ALLOWED_USER_EMAIL = "barakat2647@gmail.com";

/**
 * Normalizes an email address for consistent comparison.
 * Trims whitespace and converts to lowercase.
 *
 * @param value - Email address to normalize (can be null/undefined)
 * @returns Normalized email string (empty string if null/undefined)
 *
 * @example
 * ```ts
 * normalizeEmail(" BARAKAT2647@Gmail.com ") // "barakat2647@gmail.com"
 * normalizeEmail(null) // ""
 * ```
 */
export function normalizeEmail(value?: string | null): string {
    if (!value) return "";
    return value.trim().toLowerCase();
}

/**
 * Checks if an email address matches the allowed user email.
 * Performs case-insensitive and whitespace-tolerant comparison.
 *
 * @param value - Email address to check (can be null/undefined)
 * @returns True if email matches ALLOWED_USER_EMAIL (case-insensitive)
 *
 * @example
 * ```ts
 * isAllowedEmail("barakat2647@gmail.com") // true
 * isAllowedEmail("BARAKAT2647@gmail.com") // true
 * isAllowedEmail(" barakat2647@gmail.com ") // true
 * isAllowedEmail("other@example.com") // false
 * ```
 */
export function isAllowedEmail(value?: string | null): boolean {
    return normalizeEmail(value) === normalizeEmail(ALLOWED_USER_EMAIL);
}

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
