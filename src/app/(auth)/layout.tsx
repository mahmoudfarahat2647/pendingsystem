import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication - Pending.Sys",
    description: "Login to Pending.Sys",
};

/**
 * Minimal authentication layout for login and forgot-password pages.
 * 
 * This layout provides a clean, centered design without the main app's
 * Sidebar and Header components, suitable for authentication flows.
 * 
 * Features:
 * - Dark theme enforced
 * - Centered content
 * - Minimal distractions
 * - Responsive design
 */
export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {children}
        </div>
    );
}
