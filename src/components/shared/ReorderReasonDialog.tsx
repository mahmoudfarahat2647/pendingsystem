"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOCUS_CHAMPAGNE_VISIBLE } from "@/lib/focusStyles";
import { cn } from "@/lib/utils";

export interface ReorderReasonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reason: string;
	onReasonChange: (value: string) => void;
	onCancel: () => void;
	onConfirm: () => void;
	placeholder: string;
	helperText?: string;
	srDescription?: string;
}

export function ReorderReasonDialog({
	open,
	onOpenChange,
	reason,
	onReasonChange,
	onCancel,
	onConfirm,
	placeholder,
	helperText,
	srDescription,
}: ReorderReasonDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
				<DialogHeader>
					<DialogTitle className="text-orange-500">
						Reorder - Reason Required
					</DialogTitle>
					{srDescription ? (
						<DialogDescription className="sr-only">
							{srDescription}
						</DialogDescription>
					) : null}
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>Reason for Reorder</Label>
						<Input
							value={reason}
							onChange={(e) => onReasonChange(e.target.value)}
							placeholder={placeholder}
							className={cn(
								FOCUS_CHAMPAGNE_VISIBLE,
								"bg-white/5 border-white/10 text-white",
							)}
						/>
					</div>
					{helperText ? (
						<p className="text-sm text-muted-foreground">{helperText}</p>
					) : null}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={onCancel}
						className="border-white/20 text-white hover:bg-white/10"
					>
						Cancel
					</Button>
					<Button
						variant="renault"
						onClick={onConfirm}
						disabled={!reason.trim()}
					>
						Confirm Reorder
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
