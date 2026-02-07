"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Hash, MapPin, TableProperties, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { AppNotification } from "@/types";

export const NotificationsDropdown = () => {
	const router = useRouter();
	const [showNotifications, setShowNotifications] = useState(false);

	const notifications = useAppStore((state) => state.notifications);
	const markNotificationAsRead = useAppStore(
		(state) => state.markNotificationAsRead,
	);
	const clearNotifications = useAppStore((state) => state.clearNotifications);
	const setHighlightedRowId = useAppStore((state) => state.setHighlightedRowId);
	const removeNotification = useAppStore((state) => state.removeNotification);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const handleNotificationClick = (n: AppNotification) => {
		markNotificationAsRead(n.id);
		setHighlightedRowId(n.referenceId);
		if (n.path) {
			router.push(n.path);
		}
		setShowNotifications(false);
	};

	return (
		<div className="relative">
			<button
				type="button"
				suppressHydrationWarning
				onClick={() => setShowNotifications(!showNotifications)}
				className={cn(
					"p-2.5 rounded-xl transition-all relative",
					showNotifications
						? "bg-white/10 text-white border-white/20"
						: "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10",
				)}
				title="Notifications"
			>
				<motion.div
					animate={
						unreadCount > 0
							? {
									scale: [1, 1.2, 1],
									rotate: [0, -10, 10, -10, 10, 0],
								}
							: {}
					}
					transition={{
						duration: 0.5,
						repeat: unreadCount > 0 ? Infinity : 0,
						repeatDelay: 2,
					}}
				>
					<Bell
						className={cn(
							"h-5 w-5 transition-colors",
							unreadCount > 0
								? "text-renault-yellow drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]"
								: "text-gray-400",
						)}
					/>
				</motion.div>
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
								<h3 className="text-sm font-bold text-white">Notifications</h3>
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
																{new Date(n.timestamp).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}
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
	);
};
