"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Bell,
	Download,
	Hash,
	MapPin,
	Redo2,
	RefreshCw,
	Save,
	Search,
	TableProperties,
	Undo2,
	X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { exportWorkbookCSV } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { AppNotification } from "@/types";

export const Header = React.memo(function Header() {
	const _pathname = usePathname();
	const router = useRouter();
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const _commits = useAppStore((state) => state.commits);
	const undoStack = useAppStore((state) => state.undoStack);
	const redos = useAppStore((state) => state.redos);
	const undo = useAppStore((state) => state.undo);
	const redo = useAppStore((state) => state.redo);
	const commitSave = useAppStore((state) => state.commitSave);
	const notifications = useAppStore((state) => state.notifications);
	const markNotificationAsRead = useAppStore(
		(state) => state.markNotificationAsRead,
	);
	const clearNotifications = useAppStore((state) => state.clearNotifications);
	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const setHighlightedRowId = useAppStore((state) => state.setHighlightedRowId);
	const removeNotification = useAppStore((state) => state.removeNotification);

	const unreadCount = notifications.filter((n) => !n.isRead).length;
	const [showNotifications, setShowNotifications] = useState(false);

	const handleNotificationClick = (n: AppNotification) => {
		markNotificationAsRead(n.id);
		setHighlightedRowId(n.referenceId);
		if (n.path) {
			router.push(n.path);
		}
		setShowNotifications(false);
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
			// Cmd/Ctrl + S for save
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				commitSave();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo, commitSave]);

	// Notification Check Interval (Throttled to reduce lag)
	useEffect(() => {
		let lastCheck = Date.now();
		const MIN_INTERVAL = 30000; // 30 seconds instead of 10 to reduce lag spikes

		const throttledCheck = () => {
			const now = Date.now();
			if (now - lastCheck >= MIN_INTERVAL) {
				checkNotifications();
				lastCheck = now;
			}
		};

		checkNotifications(); // Check on mount
		const interval = setInterval(throttledCheck, 5000); // Check throttle every 5 seconds
		return () => clearInterval(interval);
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
						placeholder="Search system (Cmd+K)..."
						value={useAppStore((state) => state.searchTerm)}
						onChange={(e) =>
							useAppStore.getState().setSearchTerm(e.target.value)
						}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						className="w-full pl-12 pr-12 py-3 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
					/>
					<div className="absolute right-4 flex items-center gap-2">
						{useAppStore((state) => state.searchTerm) && (
							<button
								type="button"
								onClick={() => useAppStore.getState().setSearchTerm("")}
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
						onClick={undo}
						disabled={undoStack.length === 0}
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
						onClick={redo}
						disabled={redos.length === 0}
						className={cn(
							"p-2 rounded-lg transition-all",
							redos.length > 0
								? "text-gray-400 hover:text-white hover:bg-white/10"
								: "text-gray-700 cursor-not-allowed",
						)}
						title="Redo (Cmd+Shift+Z)"
					>
						<Redo2 className="h-4 w-4" />
					</button>
					<div className="w-px h-4 bg-white/10" />
					<button
						type="button"
						onClick={commitSave}
						className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
						title="Save Changes (Cmd+S)"
					>
						<Save className="h-4 w-4" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
						title="Refresh Page"
					>
						<RefreshCw className="h-5 w-5" />
					</button>

					<button
						type="button"
						onClick={() => {
							const {
								ordersRowData,
								rowData,
								bookingRowData,
								callRowData,
								archiveRowData,
							} = useAppStore.getState();
							exportWorkbookCSV({
								orders: ordersRowData,
								mainSheet: rowData,
								booking: bookingRowData,
								callList: callRowData,
								archive: archiveRowData,
							});
						}}
						className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
						title="Extract All (Workbook)"
					>
						<Download className="h-5 w-5" />
					</button>

					<div className="relative">
						<button
							type="button"
							onClick={() => setShowNotifications(!showNotifications)}
							className={cn(
								"p-2.5 rounded-xl transition-all relative",
								showNotifications
									? "bg-white/10 text-white border-white/20"
									: "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10",
							)}
							title="Notifications"
						>
							<Bell className="h-5 w-5" />
							{unreadCount > 0 && (
								<div className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full border-2 border-[#0a0a0b] flex items-center justify-center">
									<span className="text-[9px] font-bold text-white leading-none">
										{unreadCount > 9 ? "9+" : unreadCount}
									</span>
								</div>
							)}
						</button>

						<AnimatePresence mode="wait">
							{showNotifications && (
								<>
									<button
										type="button"
										aria-label="Close notifications"
										tabIndex={0}
										className="fixed inset-0 z-40"
										onClick={() => setShowNotifications(false)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												setShowNotifications(false);
											}
										}}
									/>
									<motion.div
										initial={{ opacity: 0, y: 10, scale: 0.95 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.95 }}
										className="absolute right-0 mt-3 w-80 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
									>
										<div className="p-4 border-b border-white/5 flex items-center justify-between">
											<h3 className="text-sm font-bold text-white">
												Notifications
											</h3>
											{notifications.length > 0 && (
												<button
													type="button"
													onClick={clearNotifications}
													className="text-[10px] text-gray-500 hover:text-white uppercase font-bold transition-colors"
												>
													Clear All
												</button>
											)}
										</div>
										<div className="max-h-[400px] overflow-y-auto custom-scrollbar">
											{notifications.length === 0 ? (
												<div className="p-8 text-center">
													<p className="text-xs text-gray-500">
														No notifications yet
													</p>
												</div>
											) : (
												<div className="flex flex-col">
													{notifications.map((n) => (
														<div
															key={n.id}
															className={cn(
																"group relative flex border-b border-white/5 bg-[#0c0c0e] hover:bg-white/[0.04] transition-all",
																!n.isRead && "bg-indigo-500/5",
															)}
														>
															<button
																type="button"
																onClick={() => handleNotificationClick(n)}
																className="flex-1 p-4 text-left flex gap-3 outline-none"
															>
																<div
																	className={cn(
																		"mt-1 w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
																		n.type === "warranty"
																			? "bg-amber-500"
																			: "bg-indigo-500",
																	)}
																/>
																<div className="flex-1 space-y-2">
																	<div className="flex items-center justify-between pr-6">
																		<span className="text-[10px] font-bold text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
																			{n.title}
																		</span>
																		<span className="text-[9px] text-gray-600 font-mono">
																			{new Date(n.timestamp).toLocaleTimeString(
																				[],
																				{ hour: "2-digit", minute: "2-digit" },
																			)}
																		</span>
																	</div>
																	<p className="text-xs text-gray-400 leading-relaxed font-medium">
																		{n.description}
																	</p>

																	<div className="flex flex-wrap gap-2 pt-1">
																		<div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
																			<TableProperties className="h-2.5 w-2.5 text-gray-500" />
																			<span className="text-[9px] text-gray-400 font-bold uppercase">
																				{n.tabName}
																			</span>
																		</div>
																		<div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
																			<Hash className="h-2.5 w-2.5 text-gray-500" />
																			<span className="text-[9px] text-gray-400 font-mono">
																				{n.trackingId}
																			</span>
																		</div>
																		<div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
																			<MapPin className="h-2.5 w-2.5 text-gray-500" />
																			<span className="text-[9px] text-gray-400 font-mono uppercase">
																				{n.vin}
																			</span>
																		</div>
																	</div>
																</div>
															</button>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	removeNotification(n.id);
																}}
																className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/5"
																title="Remove notification"
															>
																<X className="h-3.5 w-3.5" />
															</button>
														</div>
													))}
												</div>
											)}
										</div>
									</motion.div>
								</>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</header>
	);
});
