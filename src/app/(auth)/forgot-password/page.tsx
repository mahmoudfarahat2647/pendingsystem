"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
    ALLOWED_USER_EMAIL,
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Forgot password page for password reset requests.
 * 
 * Security features:
 * - Only accepts authorized email (ALLOWED_USER_EMAIL)
 * - Server-side validation via Supabase
 * - Rate limiting via middleware
 * 
 * UX features:
 * - Clear success/error feedback
 * - Loading states
 * - Link back to login
 */
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    /**
     * Handles password reset request.
     * 
     * Security flow:
     * 1. Validate email format with Zod
     * 2. Check if email matches ALLOWED_USER_EMAIL
     * 3. Send reset email via Supabase
     * 4. Display success message
     * 
     * @param e - Form submit event
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form data
        const result = forgotPasswordSchema.safeParse({ email });

        if (!result.success) {
            const errors = result.error.issues.map((err) => err.message).join(", ");
            toast.error(errors);
            return;
        }

        // Check if email is authorized
        if (email !== ALLOWED_USER_EMAIL) {
            toast.error(
                "Password reset is only available for authorized users. Please contact your administrator.",
            );
            return;
        }

        try {
            setIsLoading(true);

            const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                },
            );

            if (error) {
                toast.error(error.message);
                return;
            }

            setIsSuccess(true);
            toast.success("Password reset email sent! Check your inbox.");
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error("Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Check Your Email</CardTitle>
                    <CardDescription>
                        We've sent a password reset link to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Click the link in the email to reset your password. The link will
                        expire in 1 hour.
                    </p>
                </CardContent>
                <CardFooter>
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email address and we'll send you a reset link
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="barakat2647@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                            autoComplete="email"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Link
                        href="/login"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Back to login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
