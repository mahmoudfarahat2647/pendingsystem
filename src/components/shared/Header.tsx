"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Clock,
	Download,
	Loader2,
	Redo2,
	RefreshCw,
	Save,
	Search,
	Undo2,
	X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
	ALLOWED_COMPANIES,
	type AllowedCompany,
} from "@/domain/order/constants";
import type { OrderStage } from "@/domain/order/orderStage";
import { useNotificationCandidatesQuery } from "@/hooks/queries/useNotificationCandidatesQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useWarrantyExpiryMaintenance } from "@/hooks/useWarrantyExpiryMaintenance";
import { ORDER_STAGES, SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { exportAllSystemDataCSV } from "@/lib/exportUtils";
import { logger } from "@/lib/logger";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import {
	NOTIFICATION_CHECK_INTERVAL_MS,
	NOTIFICATION_INITIAL_DELAY_MS,
	shouldRunNotificationCheck,
} from "./headerNotificationPolling";
import { NotificationsDropdown } from "./NotificationsDropdown";

export const Header = React.memo(function Header() {
	const queryClient = useQueryClient();
	const _pathname = usePathname();
	const _router = useRouter();
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const exportDropdownRef = useRef<HTMLDivElement>(null);
	const searchWrapperRef = useRef<HTMLDivElement>(null);
	const portalRef = useRef<HTMLDivElement>(null);
	const [dropdownRect, setDropdownRect] = useState<{
		top: number;
		left: number;
		width: number;
	} | null>(null);
	const lastNotificationCheckRef = useRef<{
		dataVersion: number;
		lastRunAt: number;
	}>({ dataVersion: 0, lastRunAt: 0 });

	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const { runMaintenance } = useWarrantyExpiryMaintenance();
	useNotificationCandidatesQuery();
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const [searchInput, setSearchInput] = useState(searchTerm);
	const hasSearchInput = searchInput.trim().length > 0;
	const { recentSearches, addSearch, removeSearch, clearAll } =
		useRecentSearches();
	const showRecentDropdown =
		isSearchFocused && !hasSearchInput && recentSearches.length > 0;

	useLayoutEffect(() => {
		if (!showRecentDropdown) return;
		const update = () => {
			if (searchWrapperRef.current) {
				const r = searchWrapperRef.current.getBoundingClientRect();
				setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
			}
		};
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, [showRecentDropdown]);

	// Draft session for undo/redo and save
	const {
		canUndo,
		canRedo,
		undoDraft,
		redoDraft,
		dirty,
		saving,
		pendingCommandCount,
		saveDraft,
	} = useDraftSession();

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

			// Ctrl+S must preventDefault regardless of focus to block the browser Save Page dialog
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				if (!isEditing && dirty && !saving) saveDraft();
				return;
			}

			if (isEditing) return;

			// Cmd/Ctrl + K for search
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				document.getElementById("global-search")?.focus();
			}
			// Cmd/Ctrl + Z for undo
			if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				if (!saving) undoDraft();
			}
			// Cmd/Ctrl + Y OR Cmd/Ctrl + Shift + Z for redo
			if (
				(e.metaKey || e.ctrlKey) &&
				(e.key === "y" || (e.shiftKey && e.key === "z"))
			) {
				e.preventDefault();
				if (!saving) redoDraft();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undoDraft, redoDraft, saving, dirty, saveDraft]);

	// Notification Check Interval (Throttled to reduce lag)
	useEffect(() => {
		const check = () => {
			const stages = ["orders", "main", "call", "booking"] as const;
			const currentDataVersion = Math.max(
				...stages.map(
					(s) =>
						queryClient.getQueryState(getOrdersQueryKey(s as OrderStage))
							?.dataUpdatedAt ?? 0,
				),
			);
			const now = Date.now();
			if (
				!shouldRunNotificationCheck(
					currentDataVersion,
					now,
					lastNotificationCheckRef.current,
				)
			) {
				return;
			}

			lastNotificationCheckRef.current = {
				dataVersion: currentDataVersion,
				lastRunAt: now,
			};
			checkNotifications();
			// Run auto-archive maintenance on the same interval tick.
			// The hook has its own rate-limit ref (once per hour) so this is safe.
			runMaintenance();
		};

		// Defer first check by 3 seconds to allow app to fully render
		const initialTimeout = setTimeout(check, NOTIFICATION_INITIAL_DELAY_MS);
		const interval = setInterval(check, NOTIFICATION_CHECK_INTERVAL_MS);
		return () => {
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	}, [checkNotifications, runMaintenance]);

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
				if (searchInput.trim().length >= 2) addSearch(searchInput.trim());
			}
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeoutId);
	}, [searchInput, searchTerm, setSearchTerm, addSearch]);

	// Close export menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				exportDropdownRef.current &&
				!exportDropdownRef.current.contains(event.target as Node)
			) {
				setIsExportMenuOpen(false);
			}
		};
		if (isExportMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isExportMenuOpen]);

	const handleExport = (company: AllowedCompany) => {
		if (isExporting) return;

		setIsExportMenuOpen(false);
		setIsExporting(true);

		const toastId = toast.loading(`Preparing full ${company} system export...`);
		try {
			const mappedData: PendingRow[] = ORDER_STAGES.flatMap(
				(stage) =>
					queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)) ??
					[],
			);
			if (mappedData.length === 0) {
				toast.warning("No data available to export", { id: toastId });
				return;
			}

			const exported = exportAllSystemDataCSV(mappedData, company);
			if (!exported) {
				toast.warning("No records found for this company", {
					id: toastId,
				});
				return;
			}
			toast.success(`${company} CSV exported successfully`, {
				id: toastId,
			});
		} catch (error) {
			logger.error("Export failed:", error);
			toast.error(`Failed to export ${company} CSV`, { id: toastId });
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<header className="flex items-center justify-between h-20 px-8 border-b border-white/5 bg-transparent shrink-0">
			{/* Left: Optional space */}
			<div className="flex items-center gap-4" />

			{/* Center: Search */}
			<div className="flex-1 max-w-2xl mx-auto">
				<div
					ref={searchWrapperRef}
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
						onFocus={() => {
							setIsSearchFocused(true);
						}}
						onBlur={() => {
							setTimeout(() => {
								if (!portalRef.current?.contains(document.activeElement)) {
									setIsSearchFocused(false);
								}
							}, 0);
						}}
						onKeyDown={(e) => {
							if (e.key === "Escape" && showRecentDropdown) {
								setIsSearchFocused(false);
							}
						}}
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

					{showRecentDropdown &&
						dropdownRect &&
						createPortal(
							// biome-ignore lint/a11y/noStaticElementInteractions: prevents input blur before dropdown click registers
							<div
								ref={portalRef}
								tabIndex={-1}
								onMouseDown={(e) => e.preventDefault()}
								onBlur={(e) => {
									if (
										!portalRef.current?.contains(e.relatedTarget as Node) &&
										document.activeElement?.id !== "global-search"
									) {
										setIsSearchFocused(false);
									}
								}}
								style={{
									position: "fixed",
									top: dropdownRect.top,
									left: dropdownRect.left,
									width: dropdownRect.width,
								}}
								className="z-[9999] rounded-xl border border-white/10 bg-[#1A1A1A] shadow-xl shadow-black/50 overflow-hidden"
							>
								<div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
									<span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
										Recent Searches
									</span>
									<button
										type="button"
										onClick={clearAll}
										className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
									>
										Clear all
									</button>
								</div>
								<ul aria-label="Recent searches" className="list-none">
									{recentSearches.map((term) => (
										<li key={term} className="flex items-center group">
											<button
												type="button"
												onClick={() => {
													setSearchInput(term);
													setSearchTerm(term);
													addSearch(term);
												}}
												className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
											>
												<Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
												<span className="truncate">{term}</span>
											</button>
											<button
												type="button"
												onClick={() => removeSearch(term)}
												className="pr-3 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all"
												aria-label={`Remove ${term}`}
											>
												<X className="h-3 w-3" />
											</button>
										</li>
									))}
								</ul>
							</div>,
							document.body,
						)}
				</div>
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-3 ml-8">
				{/* Undo / Redo / Save Button Group */}
				<div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
					<button
						type="button"
						suppressHydrationWarning
						onClick={undoDraft}
						disabled={!canUndo}
						aria-label="Undo"
						className={cn(
							"p-2 rounded-lg transition-all",
							canUndo
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title="Undo (Ctrl+Z)"
					>
						<Undo2 className="h-4 w-4" />
					</button>
					<div className="w-px h-4 bg-white/10" />
					<button
						type="button"
						suppressHydrationWarning
						onClick={redoDraft}
						disabled={!canRedo}
						aria-label="Redo"
						className={cn(
							"p-2 rounded-lg transition-all",
							canRedo
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title="Redo (Ctrl+Y)"
					>
						<Redo2 className="h-4 w-4" />
					</button>
					<div className="w-px h-4 bg-white/10" />
					<button
						type="button"
						suppressHydrationWarning
						onClick={() => saveDraft()}
						disabled={!dirty || saving}
						aria-label="Save draft"
						className={cn(
							"p-2 rounded-lg transition-all",
							dirty && !saving
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title={
							saving
								? "Saving..."
								: dirty
									? `Save ${pendingCommandCount} change${pendingCommandCount !== 1 ? "s" : ""} (Ctrl+S)`
									: "Save (Ctrl+S)"
						}
					>
						{saving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
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

					<div ref={exportDropdownRef} className="relative">
						<button
							type="button"
							suppressHydrationWarning
							onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
							disabled={isExporting}
							aria-label="Export CSV"
							className={cn(
								"p-2.5 rounded-xl transition-all border",
								isExportMenuOpen
									? "text-white bg-white/10 border-white/20"
									: "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10",
								isExporting && "opacity-50 cursor-not-allowed",
							)}
							title="Export System Data"
						>
							<Download className="h-5 w-5" />
						</button>

						{isExportMenuOpen && (
							<div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#1A1A1A] p-1.5 shadow-xl shadow-black/50 z-50">
								{ALLOWED_COMPANIES.map((company) => (
									<button
										key={company}
										type="button"
										onClick={() => handleExport(company)}
										className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
									>
										<span>Export {company} Data</span>
										<span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
											CSV
										</span>
									</button>
								))}
							</div>
						)}
					</div>

					<div className="relative">
						<NotificationsDropdown />
					</div>
				</div>
			</div>
		</header>
	);
});
