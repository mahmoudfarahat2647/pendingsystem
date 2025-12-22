"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import {
    Search,
    Undo2,
    Redo2,
    RefreshCw,
    Save,
    Bell,
    Settings,
    Download,
} from "lucide-react";

export const Header = React.memo(function Header() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const { commits, redos, undo, redo, clearHistory } = useAppStore();

    // Get page title from pathname
    const getPageTitle = () => {
        const routes: Record<string, string> = {
            "/": "Dashboard",
            "/orders": "Orders",
            "/main-sheet": "Main Sheet",
            "/call-list": "Call",
            "/booking": "Booking",
            "/archive": "Archive",
        };
        return routes[pathname] || "Dashboard";
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("global-search")?.focus();
            }
            // Cmd/Ctrl + Z for undo
            if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Cmd/Ctrl + Shift + Z for redo
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    return (
        <header className="flex items-center justify-between h-20 px-8 border-b border-white/5 bg-transparent shrink-0">
            {/* Left: Page Title - Removed as it's often redundant with sidebar or dashboard header, but keeping cleaner if needed or just logo area space */}
            <div className="flex items-center gap-4">
                {/* Optional: Add Breadcrumbs or Back button here if deep navigation exists */}
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-2xl mx-auto">
                <div
                    className={cn(
                        "relative flex items-center rounded-2xl transition-all duration-300",
                        "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10",
                        isSearchFocused && "bg-black/40 border-renault-yellow/50 ring-1 ring-renault-yellow/20 shadow-[0_0_15px_rgba(255,204,0,0.1)]"
                    )}
                >
                    <Search className="absolute left-4 h-5 w-5 text-gray-500" />
                    <input
                        id="global-search"
                        type="text"
                        placeholder="Search system (Cmd+K)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full pl-12 pr-12 py-3 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                    />
                    <div className="absolute right-4 flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-gray-400 opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 ml-8">
                {/* Action Buttons Group */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    <button
                        onClick={undo}
                        disabled={commits.length === 0}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            commits.length > 0
                                ? "text-gray-400 hover:text-white hover:bg-white/10"
                                : "text-gray-700 cursor-not-allowed"
                        )}
                        title="Undo (Cmd+Z)"
                    >
                        <Undo2 className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button
                        onClick={redo}
                        disabled={redos.length === 0}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            redos.length > 0
                                ? "text-gray-400 hover:text-white hover:bg-white/10"
                                : "text-gray-700 cursor-not-allowed"
                        )}
                        title="Redo (Cmd+Shift+Z)"
                    >
                        <Redo2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>

                    <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0b]" />
                    </button>

                    <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
});
