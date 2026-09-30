"use client";

import { LocalizedScope } from "@/components/shared/LocalizedScope";
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
import { useT } from "@/hooks/useT";
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
	const { t, lang } = useT();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				closeLabel={t("common.close")}
				className="bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 text-black dark:text-white"
			>
				<DialogHeader>
					<DialogTitle className="text-orange-500">
						<LocalizedScope lang={lang}>
							{t("modals.reorder.title")}
						</LocalizedScope>
					</DialogTitle>
					{srDescription ? (
						<DialogDescription className="sr-only">
							<LocalizedScope lang={lang}>{srDescription}</LocalizedScope>
						</DialogDescription>
					) : null}
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>
							<LocalizedScope lang={lang}>
								{t("modals.reorder.reasonLabel")}
							</LocalizedScope>
						</Label>
						<Input
							value={reason}
							onChange={(e) => onReasonChange(e.target.value)}
							placeholder={placeholder}
							className={cn(
								FOCUS_CHAMPAGNE_VISIBLE,
								"bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black dark:text-white",
							)}
						/>
					</div>
					{helperText ? (
						<p className="text-sm text-muted-foreground">
							<LocalizedScope lang={lang}>{helperText}</LocalizedScope>
						</p>
					) : null}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={onCancel}
						className="border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
					>
						<LocalizedScope lang={lang}>{t("common.cancel")}</LocalizedScope>
					</Button>
					<Button
						variant="renault"
						onClick={onConfirm}
						disabled={!reason.trim()}
					>
						<LocalizedScope lang={lang}>
							{t("modals.reorder.confirm")}
						</LocalizedScope>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
