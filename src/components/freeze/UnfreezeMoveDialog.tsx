"use client";

import { ArrowRight, ShieldCheck, Snowflake } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/origin-select";
import { ORDER_STAGE_VALUES, type OrderStage } from "@/domain/order/orderStage";
import { getStageDisplayName } from "@/domain/order/orderWorkflow";
import {
	type TranslationKey,
	type TranslationParams,
	useT,
} from "@/hooks/useT";
import { FOCUS_CHAMPAGNE } from "@/lib/focusStyles";
import { cn } from "@/lib/utils";

export const UNFREEZE_DESTINATIONS: OrderStage[] = ORDER_STAGE_VALUES.filter(
	(stage) => stage !== "freeze",
);

/**
 * Describes how the selected rows' recorded pre-freeze stage(s) should be
 * summarized in the "Move to…" dialog.
 *
 * - `single`  — every selected row shares the same valid origin stage.
 * - `mixed`   — selected rows carry two or more different valid origins.
 * - `partial` — one valid origin is shared, but some rows lack it.
 * - `none`    — no selected row has a valid, non-freeze origin stage.
 */
export type UnfreezeOrigin =
	| { kind: "single"; stage: OrderStage }
	| { kind: "mixed" }
	| { kind: "partial" }
	| { kind: "none" };

export interface UnfreezeMoveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-selected destination — the caller defaults this to the row's previousStage. */
	initialStage: OrderStage;
	rowCount: number;
	/** How the selection's recorded pre-freeze stage(s) should be described. */
	origin: UnfreezeOrigin;
	onCancel: () => void;
	onConfirm: (destinationStage: OrderStage) => void;
}

function getOriginMessage(origin: UnfreezeOrigin): {
	key: TranslationKey;
	params?: TranslationParams;
} {
	switch (origin.kind) {
		case "single":
			// Stage names stay English in every language.
			return {
				key: "modals.unfreeze.originSingle",
				params: { stage: getStageDisplayName(origin.stage) },
			};
		case "mixed":
			return { key: "modals.unfreeze.originMixed" };
		case "partial":
			return { key: "modals.unfreeze.originPartial" };
		case "none":
			return { key: "modals.unfreeze.originNone" };
	}
}

export function UnfreezeMoveDialog({
	open,
	onOpenChange,
	initialStage,
	rowCount,
	origin,
	onCancel,
	onConfirm,
}: UnfreezeMoveDialogProps) {
	const { t, lang } = useT();
	const originMessage = getOriginMessage(origin);
	const [destination, setDestination] = useState<OrderStage>(initialStage);

	useEffect(() => {
		if (open) {
			setDestination(initialStage);
		}
	}, [open, initialStage]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				closeLabel={t("common.close")}
				className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-lg p-0 gap-0 overflow-hidden"
			>
				<DialogHeader className="px-6 pt-6 pb-4 text-left">
					<DialogTitle>
						<LocalizedScope lang={lang}>
							{rowCount === 1
								? t("modals.unfreeze.moveOne")
								: t("modals.unfreeze.moveMany", { count: rowCount })}
						</LocalizedScope>
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						<LocalizedScope lang={lang}>
							{rowCount === 1
								? t("modals.unfreeze.descriptionOne")
								: t("modals.unfreeze.descriptionMany")}
						</LocalizedScope>
					</DialogDescription>
				</DialogHeader>

				<div className="px-6 pb-5 flex items-center gap-3">
					<div className="flex items-center gap-2 shrink-0">
						<div className="rounded-lg bg-[#2c2c2e] border border-white/10 p-2.5">
							<Snowflake className="h-5 w-5 text-sky-400" />
						</div>
						<span className="font-semibold text-white">Freeze</span>
					</div>
					<ArrowRight className="h-5 w-5 text-gray-500 shrink-0" />
					<Select
						value={destination}
						onValueChange={(value) => setDestination(value as OrderStage)}
					>
						<SelectTrigger
							aria-label={t("modals.unfreeze.destinationAria")}
							className={cn(
								FOCUS_CHAMPAGNE,
								"flex-1 h-11 bg-[#2c2c2e] border-white/10 text-white",
							)}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-[#1c1c1e] border-white/10 text-white">
							{UNFREEZE_DESTINATIONS.map((stage) => (
								<SelectItem key={stage} value={stage}>
									{getStageDisplayName(stage)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="px-6 pb-6 flex items-start gap-3">
					<ShieldCheck className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-sm font-medium text-white">
							<LocalizedScope lang={lang}>
								{t(originMessage.key, originMessage.params)}
							</LocalizedScope>
						</p>
						<p className="text-xs text-gray-500">
							<LocalizedScope lang={lang}>
								{t("modals.unfreeze.detailsRemoved")}
							</LocalizedScope>
						</p>
					</div>
				</div>

				<DialogFooter className="px-6 py-4 border-t border-white/10 gap-3 sm:justify-end">
					<Button
						variant="outline"
						onClick={onCancel}
						className="border-white/20 text-white hover:bg-white/10"
					>
						<LocalizedScope lang={lang}>{t("common.cancel")}</LocalizedScope>
					</Button>
					<Button
						variant="renault"
						onClick={() => onConfirm(destination)}
						className="min-w-[120px]"
					>
						<LocalizedScope lang={lang}>{t("common.move")}</LocalizedScope>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
