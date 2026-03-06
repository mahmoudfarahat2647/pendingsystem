"use client";

import { Download, Redo2, RefreshCw, Search, Undo2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { exportAllSystemDataCSV } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { orderService } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { CloudSync } from "./CloudSync";
import { NotificationsDropdown } from "./NotificationsDropdown";

export const Header = React.memo(function Header() {
	const _pathname = usePathname();
	const _router = useRouter();
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const undoStack = useAppStore((state) => state.undoStack);
	const redoStack = useAppStore((state) => state.redoStack);
	const undo = useAppStore((state) => state.undo);
	const redo = useAppStore((state) => state.redo);
	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const [searchInput, setSearchInput] = useState(searchTerm);
	const hasSearchInput = searchInput.trim().length > 0;

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Safety guard: don't fire when user is editing
			const target = e.target as HTMLElement;
			const isEditing =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable ||
				target.closest(".ag-cell-edit-wrapper"); // AG-Grid edit mode

			if (isEditing) return;

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
			// Cmd/Ctrl + Y OR Cmd/Ctrl + Shift + Z for redo
			if (
				(e.metaKey || e.ctrlKey) &&
				(e.key === "y" || (e.shiftKey && e.key === "z"))
			) {
				e.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo]);

	// Notification Check Interval (Throttled to reduce lag)
	useEffect(() => {
		const CHECK_INTERVAL = 10000; // 10 seconds for more "instant" feel
		const INITIAL_DELAY = 3000; // Defer first check by 3 seconds to improve startup performance

		const check = () => {
			checkNotifications();
		};

		// Defer first check by 3 seconds to allow app to fully render
		const initialTimeout = setTimeout(check, INITIAL_DELAY);
		const interval = setInterval(check, CHECK_INTERVAL);
		return () => {
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	}, [checkNotifications]);

	// Listen for manual notification check requests (e.g., after setting a reminder)
	useEffect(() => {
		const handleManualCheck = () => {
			checkNotifications();
		};
		window.addEventListener("check-notifications", handleManualCheck);
		return () =>
			window.removeEventListener("check-notifications", handleManualCheck);
	}, [checkNotifications]);

	// Sync local input when global search changes externally (e.g., clear buttons elsewhere)
	useEffect(() => {
		setSearchInput(searchTerm);
	}, [searchTerm]);

	// Debounced search input (>= 300ms per workspace rules)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchInput !== searchTerm) {
				setSearchTerm(searchInput);
			}
		}, 350);
		return () => clearTimeout(timeoutId);
	}, [searchInput, searchTerm, setSearchTerm]);

	return (
		<header className="flex items-center justify-between h-20 px-8 border-b border-white/5 bg-transparent shrink-0">
			{/* Left: Optional space */}
			<div className="flex items-center gap-4" />

			{/* Center: Search */}
			<div className="flex-1 max-w-2xl mx-auto">
				<div
					className={cn(
						"relative flex items-center rounded-2xl transition-all duration-300",
						"bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10",
						isSearchFocused &&
							"bg-black/40 border-renault-yellow/50 ring-1 ring-renault-yellow/20 shadow-[0_0_15px_rgba(255,204,0,0.1)]",
					)}
				>
					<Search className="absolute left-4 h-5 w-5 text-gray-500" />
					<input
						id="global-search"
						type="text"
						suppressHydrationWarning
						placeholder="Search system (Cmd+K)..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						className="w-full pl-12 pr-12 py-3 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
					/>
					<div className="absolute right-4 flex items-center gap-2">
						{hasSearchInput && (
							<button
								type="button"
								onClick={() => {
									setSearchInput("");
									setSearchTerm("");
								}}
								aria-label="Clear search"
								className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
							>
								<X className="h-3 w-3" />
							</button>
						)}
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
						type="button"
						suppressHydrationWarning
						onClick={undo}
						disabled={undoStack.length === 0}
						aria-label="Undo"
						className={cn(
							"p-2 rounded-lg transition-all",
							undoStack.length > 0
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title="Undo (Cmd+Z)"
					>
						<Undo2 className="h-4 w-4" />
					</button>
					<div className="w-px h-4 bg-white/10" />
					<button
						type="button"
						suppressHydrationWarning
						onClick={redo}
						disabled={redoStack.length === 0}
						aria-label="Redo"
						className={cn(
							"p-2 rounded-lg transition-all",
							redoStack.length > 0
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title="Redo (Cmd+Shift+Z)"
					>
						<Redo2 className="h-4 w-4" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						suppressHydrationWarning
						onClick={() => window.location.reload()}
						aria-label="Refresh page"
						className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
						title="Refresh Page"
					>
						<RefreshCw className="h-5 w-5" />
					</button>

					<CloudSync />

					<button
						type="button"
						suppressHydrationWarning
						onClick={async () => {
							const toastId = toast.loading("Preparing full system export...");
							try {
								const rawData = await orderService.getOrders();
								const mappedData: PendingRow[] = [];
								for (const row of rawData) {
									const mapped = orderService.mapSupabaseOrder(
										row as Record<string, unknown>,
									);
									if (mapped) {
										mappedData.push(mapped);
									}
								}
								exportAllSystemDataCSV(mappedData);
								toast.success("Workbook exported successfully", {
									id: toastId,
								});
							} catch (error) {
								console.error("Export failed:", error);
								toast.error("Failed to export workbook", { id: toastId });
							}
						}}
						aria-label="Export workbook"
						className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
						title="Extract All (Workbook)"
					>
						<Download className="h-5 w-5" />
					</button>

					<div className="relative">
						<NotificationsDropdown />
					</div>
				</div>
			</div>
		</header>
	);
});
