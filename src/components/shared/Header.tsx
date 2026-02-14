"use client";

import { Download, RefreshCw, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { exportAllSystemDataCSV } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { orderService } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import { NotificationsDropdown } from "./NotificationsDropdown";

export const Header = React.memo(function Header() {
	const _pathname = usePathname();
	const _router = useRouter();
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const [searchInput, setSearchInput] = useState(searchTerm);
	const isAppleDevice =
		typeof globalThis.navigator !== "undefined" &&
		/Mac|iPhone|iPod|iPad/.test(globalThis.navigator.userAgent);

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
			// Undo/Redo shortcuts removed along with the feature
		};

		const browserWindow = globalThis.window;
		if (!browserWindow) return;
		browserWindow.addEventListener("keydown", handleKeyDown);
		return () => browserWindow.removeEventListener("keydown", handleKeyDown);
	}, []);

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
		const browserWindow = globalThis.window;
		if (!browserWindow) return;
		browserWindow.addEventListener("check-notifications", handleManualCheck);
		return () =>
			browserWindow.removeEventListener(
				"check-notifications",
				handleManualCheck,
			);
	}, [checkNotifications]);

	// Track the last value we pushed to the global store to avoid echo-back cycles
	const lastPushedRef = React.useRef(searchTerm);

	// Sync local input when global search changes externally (e.g., clear buttons elsewhere)
	useEffect(() => {
		// Only sync if the new global value is different from what we last pushed
		// This prevents "echo" updates where we push 'A' -> global becomes 'A' -> we receive 'A'
		// If we receive 'A' but local is already 'AB', we shouldn't revert to 'A'.
		if (searchTerm !== lastPushedRef.current) {
			setSearchInput(searchTerm);
			lastPushedRef.current = searchTerm; // Accept external change as the new baseline
		}
	}, [searchTerm]);

	// Debounced search input (>= 300ms per workspace rules)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchInput !== searchTerm) {
				lastPushedRef.current = searchInput; // Mark this as our update
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
						{searchTerm && (
							<button
								type="button"
								onClick={() => setSearchTerm("")}
								className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
							>
								<X className="h-3 w-3" />
							</button>
						)}
						<kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-gray-400 opacity-100">
							<span className="text-xs">{isAppleDevice ? "⌘" : "Ctrl+"}</span>
							<span className="ml-1">K</span>
						</kbd>
					</div>
				</div>
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-3 ml-8">
				{/* Action Buttons Group removed (Undo/Redo) */}

				<div className="flex items-center gap-2">
					<button
						type="button"
						suppressHydrationWarning
						onClick={() => globalThis.window?.location.reload()}
						className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
						title="Refresh Page"
					>
						<RefreshCw className="h-5 w-5" />
					</button>

					{/* CloudSync removed */}

					<button
						type="button"
						suppressHydrationWarning
						onClick={async () => {
							const toastId = toast.loading("Preparing full system export...");
							try {
								const rawData = await orderService.getOrders();
								const mappedData = rawData.map(orderService.mapSupabaseOrder);
								exportAllSystemDataCSV(mappedData);
								toast.success("Workbook exported successfully", {
									id: toastId,
								});
							} catch (error) {
								console.error("Export failed:", error);
								toast.error("Failed to export workbook", { id: toastId });
							}
						}}
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
