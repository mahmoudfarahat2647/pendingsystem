"use client";

import { AlertTriangle, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "destructive" | "success";
	requireTypeToConfirm?: string;
}

const variantConfig = {
	destructive: {
		ambient: "rgba(239,68,68,0.10)",
		pingBg: "rgba(239,68,68,0.14)",
		iconBg: "rgba(220,38,38,0.12)",
		iconBorder: "rgba(239,68,68,0.26)",
		iconGlow: "0 0 24px rgba(239,68,68,0.24)",
		iconColor: "#f87171",
		borderGradient:
			"linear-gradient(135deg, rgba(239,68,68,0.30) 0%, rgba(255,255,255,0.05) 50%, rgba(239,68,68,0.30) 100%)",
		accentLine:
			"linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.85) 50%, transparent 100%)",
		btnGradient: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
		btnGlow: "0 6px 20px rgba(239,68,68,0.35)",
		Icon: AlertTriangle,
	},
	default: {
		ambient: "rgba(239,68,68,0.10)",
		pingBg: "rgba(239,68,68,0.14)",
		iconBg: "rgba(220,38,38,0.12)",
		iconBorder: "rgba(239,68,68,0.26)",
		iconGlow: "0 0 24px rgba(239,68,68,0.24)",
		iconColor: "#f87171",
		borderGradient:
			"linear-gradient(135deg, rgba(239,68,68,0.30) 0%, rgba(255,255,255,0.05) 50%, rgba(239,68,68,0.30) 100%)",
		accentLine:
			"linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.85) 50%, transparent 100%)",
		btnGradient: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
		btnGlow: "0 6px 20px rgba(239,68,68,0.35)",
		Icon: AlertTriangle,
	},
	success: {
		ambient: "rgba(16,185,129,0.09)",
		pingBg: "rgba(16,185,129,0.13)",
		iconBg: "rgba(5,150,105,0.12)",
		iconBorder: "rgba(16,185,129,0.28)",
		iconGlow: "0 0 24px rgba(16,185,129,0.24)",
		iconColor: "#34d399",
		borderGradient:
			"linear-gradient(135deg, rgba(16,185,129,0.30) 0%, rgba(255,255,255,0.05) 50%, rgba(16,185,129,0.30) 100%)",
		accentLine:
			"linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.85) 50%, transparent 100%)",
		btnGradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
		btnGlow: "0 6px 20px rgba(16,185,129,0.35)",
		Icon: FileCheck,
	},
};

export const ConfirmDialog = ({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "destructive",
	requireTypeToConfirm,
}: ConfirmDialogProps) => {
	const cfg = variantConfig[variant];
	const { Icon } = cfg;

	const [inputValue, setInputValue] = useState("");

	useEffect(() => {
		if (!open) {
			setInputValue("");
		}
	}, [open]);

	const isConfirmDisabled = requireTypeToConfirm
		? inputValue.toLowerCase() !== requireTypeToConfirm.toLowerCase()
		: false;

	return (
		<>
			<style>{`
				@keyframes cd-ring {
					0%   { transform: scale(1); opacity: 0.5; }
					100% { transform: scale(2.8); opacity: 0; }
				}
				.cd-ring-1 { animation: cd-ring 2.8s ease-out infinite; }
				.cd-ring-2 { animation: cd-ring 2.8s ease-out infinite 1.4s; }
			`}</style>

			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					hideClose
					className="sm:max-w-[400px] p-0 border-0 shadow-none overflow-visible"
					style={{ background: "transparent" }}
				>
					<div
						className="rounded-2xl p-px"
						style={{ background: cfg.borderGradient }}
					>
						<div
							className="rounded-2xl overflow-hidden"
							style={{
								background: `radial-gradient(ellipse 80% 45% at 50% -10%, ${cfg.ambient}, transparent 65%), #1b1b1d`,
							}}
						>
							<div
								className="h-[1.5px] w-full"
								style={{ background: cfg.accentLine }}
							/>

							<div className="px-7 pt-9 pb-7">
								<div className="flex justify-center mb-6">
									<div
										className="relative flex items-center justify-center"
										style={{ width: 60, height: 60 }}
									>
										<div
											className="cd-ring-1 absolute inset-0 rounded-full"
											style={{ background: cfg.pingBg }}
										/>
										<div
											className="cd-ring-2 absolute inset-0 rounded-full"
											style={{ background: cfg.pingBg }}
										/>
										<div
											className="relative z-10 flex items-center justify-center rounded-xl"
											style={{
												inset: 0,
												width: 52,
												height: 52,
												background: cfg.iconBg,
												border: `1px solid ${cfg.iconBorder}`,
												boxShadow: cfg.iconGlow,
												color: cfg.iconColor,
											}}
										>
											<Icon strokeWidth={1.6} className="h-[22px] w-[22px]" />
										</div>
									</div>
								</div>

								<div className="text-center space-y-2.5">
									<DialogTitle className="text-[17px] font-bold tracking-tight text-white leading-snug">
										{title}
									</DialogTitle>
									<DialogDescription
										className="text-[13px] leading-relaxed max-w-[270px] mx-auto"
										style={{ color: "rgba(255,255,255,0.38)" }}
									>
										{description}
									</DialogDescription>
								</div>

								{requireTypeToConfirm && (
									<div className="mt-4 px-2">
										<p
											id="confirm-type-instruction"
											className="text-[12px] mb-2 font-medium"
											style={{ color: "rgba(255,255,255,0.5)" }}
										>
											Type{" "}
											<strong className="text-white">
												"{requireTypeToConfirm}"
											</strong>{" "}
											to confirm
										</p>
										<input
											title={`Type ${requireTypeToConfirm} to confirm`}
											type="text"
											autoFocus
											aria-labelledby="confirm-type-instruction"
											aria-describedby="confirm-type-instruction"
											value={inputValue}
											onChange={(e) => setInputValue(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !isConfirmDisabled) {
													onConfirm();
													onOpenChange(false);
												}
											}}
											className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
											placeholder={requireTypeToConfirm}
										/>
									</div>
								)}

								<div
									className="mt-7 mb-6 h-px"
									style={{ background: "rgba(255,255,255,0.06)" }}
								/>

								<div className="flex gap-3">
									<Button
										variant="ghost"
										onClick={() => onOpenChange(false)}
										className="flex-1 h-10 rounded-xl text-[13px] font-medium active:scale-95 transition-all duration-150 hover:bg-white/10 hover:text-white"
										style={{
											color: "rgba(255,255,255,0.85)",
											background: "rgba(255,255,255,0.08)",
											border: "1px solid rgba(255,255,255,0.12)",
										}}
									>
										{cancelText}
									</Button>
									<Button
										onClick={() => {
											if (isConfirmDisabled) return;
											onConfirm();
											onOpenChange(false);
										}}
										disabled={isConfirmDisabled}
										className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white border-0 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
										style={{
											background: cfg.btnGradient,
											boxShadow: isConfirmDisabled ? "none" : cfg.btnGlow,
										}}
									>
										{confirmText}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
