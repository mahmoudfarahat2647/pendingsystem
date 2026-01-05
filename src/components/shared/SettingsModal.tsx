"use client";

import {
	CalendarCheck,
	History,
	Lock,
	Palette,
	Settings as SettingsIcon,
	Shield,
	Tag,
	Unlock,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import { BookingStatusTab } from "./settings/BookingStatusTab";
import { HistoryTab } from "./settings/HistoryTab";
import { PartStatusTab } from "./settings/PartStatusTab";
import { ThemeTab } from "./settings/ThemeTab";
import BackupReportsTab from "../reports/BackupReportsTab";

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type TabType =
	| "part-statuses"
	| "booking-statuses"
	| "theme-color"
	| "last-changes"
	| "backup-reports";

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("part-statuses");
	const [passwordAttempt, setPasswordAttempt] = useState("");
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);

	const isLocked = useAppStore((state) => state.isLocked);
	const setIsLocked = useAppStore((state) => state.setIsLocked);

	const navItems = [
		{ id: "part-statuses", label: "Part Statuses", icon: Tag },
		{ id: "booking-statuses", label: "Booking Statuses", icon: CalendarCheck },
		{ id: "theme-color", label: "Theme Color", icon: Palette },
		{ id: "last-changes", label: "Last Changes", icon: History },
		{ id: "backup-reports", label: "Backup & Reports", icon: Shield },
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
								type="button"
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
								type="button"
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
										: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
								)}
							>
								<div className="flex items-center gap-2">
									{isLocked ? (
										<Lock className="h-4 w-4" />
									) : (
										<Unlock className="h-4 w-4" />
									)}
									<span className="text-xs font-bold uppercase tracking-wider">
										{isLocked ? "Locked" : "Unlocked"}
									</span>
								</div>
								{!isLocked && (
									<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								)}
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
											if (passwordAttempt === "1234") {
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
								{activeTab === "backup-reports" && "Backup & Reports Settings"}
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
								{activeTab === "backup-reports" &&
									"Configure automated reports and manage data backups."}
							</p>
						</div>
					</header>

					<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
						{activeTab === "part-statuses" && (
							<PartStatusTab isLocked={isLocked} />
						)}

						{activeTab === "booking-statuses" && (
							<BookingStatusTab isLocked={isLocked} />
						)}

						{activeTab === "theme-color" && <ThemeTab />}

						{activeTab === "last-changes" && <HistoryTab />}

						{activeTab === "backup-reports" && (
							<BackupReportsTab isLocked={isLocked} />
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
