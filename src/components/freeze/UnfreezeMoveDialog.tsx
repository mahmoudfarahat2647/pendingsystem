"use client";

import { ArrowRight, ShieldCheck, Snowflake } from "lucide-react";
import { useEffect, useState } from "react";
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

function getOriginMessage(origin: UnfreezeOrigin): string {
	switch (origin.kind) {
		case "single":
			return `Came from ${getStageDisplayName(origin.stage)}`;
		case "mixed":
			return "Mixed origin stages";
		case "partial":
			return "Some origins not recorded";
		case "none":
			return "Origin stage not recorded";
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
	const [destination, setDestination] = useState<OrderStage>(initialStage);

	useEffect(() => {
		if (open) {
			setDestination(initialStage);
		}
	}, [open, initialStage]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-lg p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 pt-6 pb-4 text-left">
					<DialogTitle>
						Move {rowCount === 1 ? "1 row" : `${rowCount} rows`}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						Choose the next stage for{" "}
						{rowCount === 1 ? "this frozen row" : "these frozen rows"}.
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
							aria-label="Destination stage"
							className="flex-1 h-11 bg-[#2c2c2e] border-white/10 text-white"
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
							{getOriginMessage(origin)}
						</p>
						<p className="text-xs text-gray-500">
							Freeze details will be removed. All other data is kept.
						</p>
					</div>
				</div>

				<DialogFooter className="px-6 py-4 border-t border-white/10 gap-3 sm:justify-end">
					<Button
						variant="outline"
						onClick={onCancel}
						className="border-white/20 text-white hover:bg-white/10"
					>
						Cancel
					</Button>
					<Button
						variant="renault"
						onClick={() => onConfirm(destination)}
						className="min-w-[120px]"
					>
						Move
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
