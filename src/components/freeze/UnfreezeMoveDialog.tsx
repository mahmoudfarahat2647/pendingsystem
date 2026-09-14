"use client";

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
import { Label } from "@/components/ui/label";
import { ORDER_STAGE_VALUES, type OrderStage } from "@/domain/order/orderStage";
import { getStageDisplayName } from "@/domain/order/orderWorkflow";

export const UNFREEZE_DESTINATIONS: OrderStage[] = ORDER_STAGE_VALUES.filter(
	(stage) => stage !== "freeze",
);

export interface UnfreezeMoveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-selected destination — the caller defaults this to the row's previousStage. */
	initialStage: OrderStage;
	rowCount: number;
	onCancel: () => void;
	onConfirm: (destinationStage: OrderStage) => void;
}

export function UnfreezeMoveDialog({
	open,
	onOpenChange,
	initialStage,
	rowCount,
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
			<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
				<DialogHeader>
					<DialogTitle className="text-sky-400">
						Move to… — Unfreeze {rowCount === 1 ? "1 row" : `${rowCount} rows`}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						Choose the destination stage. Status, booking details, notes,
						reminders, and attachments are preserved; only the freeze metadata
						is cleared.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label htmlFor="unfreeze-destination">Destination stage</Label>
						<select
							id="unfreeze-destination"
							value={destination}
							onChange={(e) => setDestination(e.target.value as OrderStage)}
							className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white"
						>
							{UNFREEZE_DESTINATIONS.map((stage) => (
								<option key={stage} value={stage} className="bg-[#1c1c1e]">
									{getStageDisplayName(stage)}
								</option>
							))}
						</select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={onCancel}
						className="border-white/20 text-white hover:bg-white/10"
					>
						Cancel
					</Button>
					<Button variant="renault" onClick={() => onConfirm(destination)}>
						Confirm Move
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
