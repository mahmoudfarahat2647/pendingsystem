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
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Login page for single-user authentication.
 * 
 * Security features:
 * - Client-side validation with Zod
 * - Password show/hide toggle
 * - Cookie-based session storage
 * - Server-side email verification in middleware
 * 
 * UX features:
 * - Loading states
 * - Error feedback via toast
 * - Keyboard navigation support
 * - Dark theme styling
 */
export default function LoginPage() {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    /**
     * Handles form submission with validation and authentication.
     * 
     * Flow:
     * 1. Validate form data with Zod schema
     * 2. Call login function from useAuth hook
     * 3. On success: Redirect to dashboard (handled in useAuth)
     * 4. On error: Display error toast
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form data
        const result = loginSchema.safeParse({ email, password });

        if (!result.success) {
            const errors = result.error.issues.map((err) => err.message).join(", ");
            toast.error(errors);
            return;
        }

        try {
            await login(email, password);
        } catch (error) {
            // Error handling is done in useAuth hook
            console.error("Login failed:", error);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                    Sign in to access the Pending.Sys dashboard
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
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                autoComplete="current-password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Forgot your password?
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
