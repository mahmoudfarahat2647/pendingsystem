"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
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
	variant?: "default" | "destructive";
}

export const ConfirmDialog = ({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "destructive",
}: ConfirmDialogProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px] bg-[#1c1c1e] border border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />

				<DialogHeader className="pt-4">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-xl bg-red-500/10 text-red-500">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<DialogTitle className="text-xl font-bold tracking-tight text-white leading-none">
							{title}
						</DialogTitle>
					</div>
					<DialogDescription className="text-slate-400 text-sm leading-relaxed pt-2">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="gap-3 sm:gap-0 mt-6 pb-2">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 border-none rounded-xl h-11 font-semibold transition-all active:scale-95"
					>
						{cancelText}
					</Button>
					<Button
						variant={variant === "destructive" ? "destructive" : "default"}
						onClick={() => {
							onConfirm();
							onOpenChange(false);
						}}
						className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none rounded-xl h-11 font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95"
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
