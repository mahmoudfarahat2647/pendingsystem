"use client";

import {
	Lock,
	Palette,
	Plus,
	Settings as SettingsIcon,
	Tag,
	Trash2,
	Undo2,
	Unlock,
	CalendarCheck,
	History,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartStatusDef } from "@/types";

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type TabType =
	| "part-statuses"
	| "booking-statuses"
	| "theme-color"
	| "last-changes";

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("part-statuses");
	const [passwordAttempt, setPasswordAttempt] = useState("");
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const addPartStatusDef = useAppStore((state) => state.addPartStatusDef);
	const removePartStatusDef = useAppStore((state) => state.removePartStatusDef);
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);
	const addBookingStatusDef = useAppStore((state) => state.addBookingStatusDef);
	const removeBookingStatusDef = useAppStore((state) => state.removeBookingStatusDef);
	const commits = useAppStore((state) => state.commits);
	const isLocked = useAppStore((state) => state.isLocked);
	const setIsLocked = useAppStore((state) => state.setIsLocked);

	const [newStatusLabel, setNewStatusLabel] = useState("");
	const [selectedColor, _setSelectedColor] = useState("bg-emerald-500");

	const colorPalette = [
		"bg-emerald-500",
		"bg-gray-800",
		"bg-yellow-400",
		"bg-amber-800",
		"bg-red-500",
		"bg-blue-500",
		"bg-purple-500",
		"bg-pink-500",
		"bg-indigo-500",
		"bg-green-500",
		"bg-teal-500",
		"bg-cyan-500",
	];

	const _handleAddStatus = () => {
		if (!newStatusLabel.trim()) return;
		const newStatus: PartStatusDef = {
			id: Math.random().toString(36).substring(2, 9),
			label: newStatusLabel.trim(),
			color: selectedColor,
		};
		addPartStatusDef(newStatus);
		setNewStatusLabel("");
	};

	const navItems = [
		{ id: "part-statuses", label: "Part Statuses", icon: Tag },
		{ id: "booking-statuses", label: "Booking Statuses", icon: CalendarCheck },
		{ id: "theme-color", label: "Theme Color", icon: Palette },
		{ id: "last-changes", label: "Last Changes", icon: History },
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#0a0a0b] text-white border-white/10 max-w-5xl p-0 gap-0 overflow-hidden flex h-[80vh] rounded-3xl shadow-2xl">
				{/* Sidebar Navigation */}
				<div className="w-64 border-r border-white/5 bg-black/20 flex flex-col">
					<div className="p-6 flex items-center gap-2 border-b border-white/5">
						<SettingsIcon className="h-5 w-5 text-gray-400" />
						<DialogTitle className="font-bold text-lg tracking-tight">
							Settings
						</DialogTitle>
					</div>
					<nav className="flex-1 p-3 space-y-1">
						{navItems.map((item) => (
							<button
								key={item.id}
								onClick={() => setActiveTab(item.id as TabType)}
								className={cn(
									"w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
									activeTab === item.id
										? "bg-renault-yellow text-black font-semibold shadow-lg shadow-renault-yellow/20"
										: "text-gray-400 hover:bg-white/5 hover:text-white",
								)}
							>
								<item.icon
									className={cn(
										"h-5 w-5",
										activeTab === item.id
											? "text-black"
											: "text-gray-500 group-hover:text-white",
									)}
								/>
								<span className="text-sm">{item.label}</span>
							</button>
						))}
					</nav>
					<div className="p-6 border-t border-white/5 space-y-3">
						{!showPasswordPrompt ? (
							<button
								onClick={() => {
									if (isLocked) {
										setShowPasswordPrompt(true);
										setTimeout(() => passwordInputRef.current?.focus(), 100);
									} else {
										setIsLocked(true);
									}
								}}
								className={cn(
									"w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
									isLocked
										? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
										: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
								)}
							>
								<div className="flex items-center gap-2">
									{isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
									<span className="text-xs font-bold uppercase tracking-wider">
										{isLocked ? "Locked" : "Unlocked"}
									</span>
								</div>
								{!isLocked && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
							</button>
						) : (
							<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
								<Input
									ref={passwordInputRef}
									type="password"
									placeholder="Password"
									value={passwordAttempt}
									onChange={(e) => setPasswordAttempt(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											if (passwordAttempt === "1234") {
												setIsLocked(false);
												setShowPasswordPrompt(false);
												setPasswordAttempt("");
											} else {
												setPasswordAttempt("");
											}
										} else if (e.key === "Escape") {
											setShowPasswordPrompt(false);
											setPasswordAttempt("");
										}
									}}
									className="h-9 bg-black/40 border-white/10 text-xs text-center rounded-lg"
								/>
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										className="flex-1 h-7 text-[10px] uppercase font-bold text-gray-400"
										onClick={() => {
											setShowPasswordPrompt(false);
											setPasswordAttempt("");
										}}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										className="flex-1 h-7 text-[10px] uppercase font-bold bg-emerald-500 hover:bg-emerald-400 text-black"
										onClick={() => {
											if (passwordAttempt === "Tot2647tot") {
												setIsLocked(false);
												setShowPasswordPrompt(false);
												setPasswordAttempt("");
											} else {
												setPasswordAttempt("");
											}
										}}
									>
										Unlock
									</Button>
								</div>
							</div>
						)}
						<div className="flex items-center justify-between pt-2">
							<div className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">
								Version
							</div>
							<div className="text-[10px] font-bold text-gray-600">v2.5.0</div>
						</div>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 flex flex-col bg-[#1c1c1e]">
					<header className="p-6 flex items-center justify-between border-b border-white/5 h-[73px]">
						<div>
							<h3 className="font-bold text-lg">
								{activeTab === "part-statuses" && "Part Status Management"}
								{activeTab === "booking-statuses" &&
									"Booking Status Management"}
								{activeTab === "theme-color" && "System Appearance"}
								{activeTab === "last-changes" && "System History (Last 48h)"}
							</h3>
							<p className="text-xs text-gray-400">
								{activeTab === "part-statuses" &&
									"Customize status labels and colors used in the grid."}
								{activeTab === "booking-statuses" &&
									"Customize labels and colors for booking statuses."}
								{activeTab === "theme-color" &&
									"Manage theme colors and UI preferences."}
								{activeTab === "last-changes" &&
									"Review and restore recent changes."}
							</p>
						</div>
					</header>

					<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
						{activeTab === "part-statuses" && (
							<StatusManagementSection
								title="Add New Part Status"
								managedTitle="Managed Part Statuses"
								statuses={partStatuses}
								onAdd={(label, color) => {
									const newStatus: PartStatusDef = {
										id: Math.random().toString(36).substring(2, 9),
										label,
										color,
									};
									addPartStatusDef(newStatus);
								}}
								onRemove={removePartStatusDef}
								colorPalette={colorPalette}
								isLocked={isLocked}
							/>
						)}

						{activeTab === "booking-statuses" && (
							<StatusManagementSection
								title="Add New Booking Status"
								managedTitle="Managed Booking Statuses"
								statuses={bookingStatuses}
								onAdd={(label, color) => {
									const newStatus: PartStatusDef = {
										id: Math.random().toString(36).substring(2, 9),
										label,
										color,
									};
									addBookingStatusDef(newStatus);
								}}
								onRemove={removeBookingStatusDef}
								colorPalette={colorPalette}
								isLocked={isLocked}
							/>
						)}

						{activeTab === "theme-color" && (
							<div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in duration-500">
								<Palette className="h-12 w-12 text-gray-600 mb-4" />
								<h3 className="text-gray-400 font-medium">
									Appearance Settings
								</h3>
								<p className="text-sm text-gray-600 mt-2">
									Custom themes and color presets are coming soon.
								</p>
							</div>
						)}

						{activeTab === "last-changes" && (
							<div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
								<div className="space-y-0 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
									{commits.length === 0 ? (
										<div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
											<History className="h-10 w-10 text-gray-700 mb-4" />
											<p className="text-gray-500 text-sm">
												No activity recorded for this session.
											</p>
										</div>
									) : (
										[...commits].reverse().map((commit, index) => {
											const isLatest = index === 0;
											const date = new Date(commit.timestamp);
											const timeString = date.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											});
											const dateString = date.toLocaleDateString([], {
												month: "2-digit",
												day: "2-digit",
												year: "numeric",
											});

											return (
												<div
													key={commit.id}
													className="relative pl-12 pb-10 last:pb-0 group"
												>
													{/* Timeline Dot */}
													<div
														className={cn(
															"absolute left-[13px] top-1.5 w-[10px] h-[10px] rounded-full border-2 border-[#1c1c1e] z-10 transition-all duration-300",
															isLatest
																? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
																: "bg-gray-700 group-hover:bg-indigo-400",
														)}
													/>

													{/* Card */}
													<div
														className={cn(
															"p-5 rounded-2xl border transition-all duration-300",
															isLatest
																? "bg-emerald-500/5 border-emerald-500/20"
																: "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/[0.07]",
														)}
													>
														<div className="flex items-start justify-between gap-4">
															<div className="space-y-1">
																<div className="flex items-center gap-3">
																	<h5 className="font-semibold text-gray-200">
																		{commit.actionName}
																	</h5>
																	{isLatest && (
																		<span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-500 tracking-wider">
																			LATEST
																		</span>
																	)}
																</div>
																<div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
																	<span>{timeString}</span>
																	<span className="w-1 h-1 rounded-full bg-gray-700" />
																	<span>{dateString}</span>
																</div>
															</div>

															{!isLatest && (
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		useAppStore
																			.getState()
																			.restoreToCommit(commit.id)
																	}
																	className="h-8 rounded-xl border-white/10 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-400/30 transition-all"
																>
																	<Undo2 className="h-3.5 w-3.5 mr-2" />
																	Restore
																</Button>
															)}
														</div>
													</div>
												</div>
											);
										})
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

interface StatusManagementSectionProps {
	title: string;
	managedTitle: string;
	statuses: PartStatusDef[];
	onAdd: (label: string, color: string) => void;
	onRemove: (id: string) => void;
	colorPalette: string[];
	isLocked: boolean;
}

const StatusManagementSection = ({
	title,
	managedTitle,
	statuses,
	onAdd,
	onRemove,
	colorPalette,
	isLocked,
}: StatusManagementSectionProps) => {
	const [newLabel, setNewLabel] = useState("");
	const [selectedColor, setSelectedColor] = useState("bg-emerald-500");

	return (
		<div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Add New Status */}
			<div className={cn(
				"p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative transition-all duration-300",
				isLocked && "grayscale pointer-events-none opacity-50"
			)}>
				{isLocked && (
					<div className="absolute inset-0 flex items-center justify-center z-20">
						<div className="px-3 py-1.5 bg-black/80 border border-white/10 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-sm">
							<Lock className="h-3 w-3 text-red-400" />
							<span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Editors Locked</span>
						</div>
					</div>
				)}
				<h4 className="text-sm font-semibold text-white uppercase tracking-wider">
					{title}
				</h4>
				<div className="flex gap-4">
					<Input
						value={newLabel}
						onChange={(e) => setNewLabel(e.target.value)}
						placeholder="Enter status label (e.g., In Transit)"
						className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-renault-yellow/50"
						disabled={isLocked}
					/>
					<Button
						onClick={() => {
							onAdd(newLabel, selectedColor);
							setNewLabel("");
						}}
						disabled={!newLabel.trim() || isLocked}
						className="h-12 px-6 bg-renault-yellow hover:bg-renault-yellow/90 text-black font-bold rounded-xl transition-all active:scale-95"
					>
						<Plus className="h-5 w-5 mr-2" />
						Add Status
					</Button>
				</div>
				<div className="space-y-3">
					<p className="text-xs font-medium text-gray-500 uppercase">
						Select Color Theme
					</p>
					<div className="flex flex-wrap gap-2">
						{colorPalette.map((color) => (
							<button
								key={color}
								onClick={() => setSelectedColor(color)}
								disabled={isLocked}
								className={cn(
									"w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 active:scale-90",
									color,
									selectedColor === color
										? "ring-2 ring-white ring-offset-4 ring-offset-[#1c1c1e] scale-110"
										: "opacity-60 hover:opacity-100",
								)}
							/>
						))}
					</div>
				</div>
			</div>

			{/* List of Statuses */}
			<div className="space-y-4">
				<h4 className="text-sm font-semibold text-white uppercase tracking-wider px-2">
					{managedTitle}
				</h4>
				<div className="grid gap-3">
					{statuses.map((status) => (
						<div
							key={status.id}
							className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
						>
							<div className="flex items-center gap-4">
								<div
									className={cn("w-3 h-3 rounded-full shadow-lg", status.color)}
								/>
								<span className="font-medium text-gray-200">
									{status.label}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemove(status.id)}
								disabled={isLocked}
								className={cn(
									"h-9 w-9 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all",
									isLocked ? "opacity-0" : "opacity-0 group-hover:opacity-100"
								)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
