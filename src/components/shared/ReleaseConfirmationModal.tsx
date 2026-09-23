"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { RELEASE_CONFIRMATION_WORD } from "@/domain/order/releaseGate";
import { FOCUS_CHAMPAGNE_VISIBLE } from "@/lib/focusStyles";
import { cn } from "@/lib/utils";

export interface ReleaseConfirmationModalProps {
	open: boolean;
	vin: string;
	formattedMileage: string;
	/** Called on Cancel, close X, or Escape — all run the same cancellation path. */
	onCancel: () => void;
	/** Called once the trimmed, case-insensitive value equals "release". */
	onConfirm: () => void;
	pending?: boolean;
}

/**
 * Approved "Release required" confirmation modal (issue #242). Renders the
 * exact copy, layout and field set from the approved design — do not add
 * affected-part content, cards, or change the visual hierarchy.
 */
export function ReleaseConfirmationModal({
	open,
	vin,
	formattedMileage,
	onCancel,
	onConfirm,
	pending = false,
}: ReleaseConfirmationModalProps) {
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Clear the input after cancel, close, success, or failure — i.e. any
	// transition of `open`.
	useEffect(() => {
		setValue("");
	}, [open]);

	useEffect(() => {
		if (open) {
			// Opening the modal focuses the confirmation input.
			const id = window.setTimeout(() => inputRef.current?.focus(), 0);
			return () => window.clearTimeout(id);
		}
	}, [open]);

	const isValid = value.trim().toLowerCase() === RELEASE_CONFIRMATION_WORD;
	const isConfirmDisabled = !isValid || pending;

	const handleConfirm = () => {
		if (isConfirmDisabled) return;
		onConfirm();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
		>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-lg p-0 gap-0 overflow-hidden rounded-[10px]">
				<DialogDescription className="sr-only">
					Warranty chassis under 5,000 km — confirm approval before moving to
					Call List.
				</DialogDescription>
				<div className="p-6">
					<div className="flex items-start gap-3">
						<div className="mt-1 flex h-7 w-7 shrink-0 rotate-45 items-center justify-center rounded-[6px] border-2 border-renault-yellow">
							<AlertTriangle className="h-3.5 w-3.5 -rotate-45 text-renault-yellow" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl font-semibold leading-tight text-white">
								Release required
							</DialogTitle>
							<p className="mt-1 text-sm text-gray-400">
								Warranty chassis under 5,000 km — confirm approval before moving
								to Call List.
							</p>
						</div>
					</div>

					<div className="mt-5 grid grid-cols-3 gap-4">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
								VIN
							</p>
							<p className="mt-1 break-all text-[15px] text-gray-100">{vin}</p>
						</div>
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
								Mileage
							</p>
							<p className="release-value-pulse mt-1 text-[15px] text-gray-100">
								{formattedMileage} km
							</p>
						</div>
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
								Repair system
							</p>
							<p className="release-value-pulse-alt mt-1 text-[15px] text-gray-100">
								Warranty
							</p>
						</div>
					</div>

					<div className="mt-5 border-t border-white/10" />

					<div className="mt-5">
						<label
							htmlFor="release-confirmation-word"
							className="text-[13px] font-medium text-gray-300"
						>
							Enter confirmation word
						</label>
						<input
							id="release-confirmation-word"
							ref={inputRef}
							type="text"
							autoComplete="off"
							placeholder={RELEASE_CONFIRMATION_WORD}
							value={value}
							disabled={pending}
							onChange={(e) => setValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !isConfirmDisabled) {
									handleConfirm();
								}
							}}
							className={cn(
								FOCUS_CHAMPAGNE_VISIBLE,
								"mt-2 h-10 w-full rounded-md border border-white/10 bg-[#2c2c2e] px-3 text-white placeholder:text-gray-600",
							)}
						/>
						<p className="mt-2 text-[12px] text-gray-500">
							This approval applies to this move only.
						</p>
					</div>

					<div className="mt-6 flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={pending}
							className="border-white/20 text-white hover:bg-white/10"
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="renault"
							onClick={handleConfirm}
							disabled={isConfirmDisabled}
						>
							Release to Call List
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
