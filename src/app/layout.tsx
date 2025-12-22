import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { MainContentWrapper } from "@/components/shared/MainContentWrapper";
import { Toaster } from "sonner";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    preload: true,
    adjustFontFallback: true,
});

export const metadata: Metadata = {
    title: "Pending.Sys - Renault Logistics Command Center",
    description: "Logistics Command Center for automotive service centers",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <div className="flex h-screen overflow-hidden bg-background">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header />
                        <main className="flex-1 overflow-y-auto p-6">
                            <MainContentWrapper>
                                {children}
                            </MainContentWrapper>
                        </main>
                    </div>
                </div>
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
