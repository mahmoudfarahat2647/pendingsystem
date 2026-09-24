"use client";

import {
	Lock,
	Palette,
	PencilLine,
	Settings as SettingsIcon,
	Shield,
	Tag,
	Unlock,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/useT";
import type { TranslationKey } from "@/i18n/dictionaries/en";
import { FOCUS_CHAMPAGNE_VISIBLE } from "@/lib/focusStyles";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import BackupReportsTab from "../reports/BackupReportsTab";
import { LanguageToggle } from "./LanguageToggle";
import { LocalizedScope } from "./LocalizedScope";
import { PartStatusTab } from "./settings/PartStatusTab";
import { PermissionTab } from "./settings/PermissionTab";
import { ThemeTab } from "./settings/ThemeTab";

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type TabType =
	| "part-statuses"
	| "theme-color"
	| "backup-reports"
	| "permission";

const TAB_HEADINGS: Record<
	TabType,
	{ title: TranslationKey; description: TranslationKey }
> = {
	"part-statuses": {
		title: "settings.sections.statusTitle",
		description: "settings.sections.statusDescription",
	},
	"theme-color": {
		title: "settings.sections.appearanceTitle",
		description: "settings.sections.appearanceDescription",
	},
	"backup-reports": {
		title: "settings.sections.backupTitle",
		description: "settings.sections.backupDescription",
	},
	permission: {
		title: "settings.sections.permissionTitle",
		description: "settings.sections.permissionDescription",
	},
};

// Client-side only settings password (defaults to env var or falls back for development)
const _getSettingsPassword = (): string | undefined => {
	if (typeof window === "undefined") return undefined;
	// This will be set from window.__ENV__ during initialization
	return (window as unknown as { __SETTINGS_PASSWORD__?: string })
		.__SETTINGS_PASSWORD__;
};

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("part-statuses");
	const [passwordAttempt, setPasswordAttempt] = useState("");
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
	const [authError, setAuthError] = useState(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);

	const isLocked = useAppStore((state) => state.isLocked);
	const setIsLocked = useAppStore((state) => state.setIsLocked);
	const { t, lang } = useT();

	const navItems = [
		{ id: "part-statuses", label: t("settings.tabs.statuses"), icon: Tag },
		{ id: "theme-color", label: t("settings.tabs.themeColor"), icon: Palette },

		{
			id: "backup-reports",
			label: t("settings.tabs.backupReports"),
			icon: Shield,
		},
		{
			id: "permission",
			label: t("settings.tabs.permission"),
			icon: PencilLine,
		},
	];

	const handleUnlock = (attempt: string) => {
		// Get password from environment variable (injected at build time).
		// If not configured, unlock always fails — do not fall back to a default.
		const validPassword = process.env.NEXT_PUBLIC_SETTINGS_PASSWORD;

		if (validPassword && attempt === validPassword) {
			setIsLocked(false);
			setShowPasswordPrompt(false);
			setPasswordAttempt("");
			setAuthError(false);
		} else {
			setPasswordAttempt("");
			setAuthError(true);
			// Clear error after 2 seconds
			setTimeout(() => setAuthError(false), 2000);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				closeLabel={t("settings.modal.close")}
				className="bg-[#0a0a0b] text-white border-white/10 max-w-5xl p-0 gap-0 overflow-hidden flex h-[80vh] rounded-3xl shadow-2xl"
			>
				{/* Sidebar Navigation */}
				<div className="w-64 border-r border-white/5 bg-black/20 flex flex-col">
					<div className="p-6 flex items-center gap-2 border-b border-white/5">
						<SettingsIcon className="h-5 w-5 text-gray-400" />
						<DialogTitle className="font-bold text-lg tracking-tight">
							<LocalizedScope lang={lang}>
								{t("settings.modal.title")}
							</LocalizedScope>
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
								<span className="text-sm">
									<LocalizedScope lang={lang}>{item.label}</LocalizedScope>
								</span>
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
										<LocalizedScope lang={lang}>
											{isLocked
												? t("settings.modal.locked")
												: t("settings.modal.unlocked")}
										</LocalizedScope>
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
									placeholder={
										authError
											? t("settings.modal.incorrectPassword")
											: t("settings.modal.password")
									}
									value={passwordAttempt}
									onChange={(e) => setPasswordAttempt(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleUnlock(passwordAttempt);
										} else if (e.key === "Escape") {
											setShowPasswordPrompt(false);
											setPasswordAttempt("");
											setAuthError(false);
										}
									}}
									className={cn(
										FOCUS_CHAMPAGNE_VISIBLE,
										"h-9 bg-black/40 border-white/10 text-xs text-center rounded-lg",
										authError &&
											"border-red-500/50 placeholder:text-red-400/50",
									)}
								/>
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										className="flex-1 h-7 text-[10px] uppercase font-bold text-gray-400"
										onClick={() => {
											setShowPasswordPrompt(false);
											setPasswordAttempt("");
											setAuthError(false);
										}}
									>
										<LocalizedScope lang={lang}>
											{t("common.cancel")}
										</LocalizedScope>
									</Button>
									<Button
										size="sm"
										className="flex-1 h-7 text-[10px] uppercase font-bold bg-emerald-500 hover:bg-emerald-400 text-black"
										onClick={() => handleUnlock(passwordAttempt)}
									>
										<LocalizedScope lang={lang}>
											{t("settings.modal.unlock")}
										</LocalizedScope>
									</Button>
								</div>
							</div>
						)}
						<div className="flex items-center justify-between pt-2">
							<div className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">
								<LocalizedScope lang={lang}>
									{t("settings.modal.version")}
								</LocalizedScope>
							</div>
							<div className="text-[10px] font-bold text-gray-600">v2.5.0</div>
						</div>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 flex flex-col bg-[#1c1c1e]">
					<header className="p-6 pr-14 flex items-center justify-between border-b border-white/5 h-[73px]">
						<div>
							<h3 className="font-bold text-lg">
								<LocalizedScope lang={lang}>
									{t(TAB_HEADINGS[activeTab].title)}
								</LocalizedScope>
							</h3>
							<p className="text-xs text-gray-400">
								<LocalizedScope lang={lang}>
									{t(TAB_HEADINGS[activeTab].description)}
								</LocalizedScope>
							</p>
						</div>
						{/* Language switch — intentionally outside the lock gate so anyone can switch.
						    Header pr-14 keeps it clear of DialogContent's absolute close button. */}
						<LanguageToggle />
					</header>

					<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
						{activeTab === "part-statuses" && (
							<PartStatusTab isLocked={isLocked} />
						)}

						{activeTab === "theme-color" && <ThemeTab />}

						{activeTab === "backup-reports" && (
							<BackupReportsTab isLocked={isLocked} />
						)}

						{activeTab === "permission" && (
							<PermissionTab isLocked={isLocked} />
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
