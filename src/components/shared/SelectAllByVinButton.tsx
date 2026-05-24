"use client";

import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SelectAllByVinButtonProps {
	onSelectAllByVin: () => void;
	isDisabled: boolean;
}

export function SelectAllByVinButton({
	onSelectAllByVin,
	isDisabled,
}: SelectAllByVinButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size="icon"
					variant="ghost"
					aria-label="Select all rows for this VIN"
					className={cn(
						"h-8 w-8 text-gray-400 hover:text-white",
						isDisabled && "opacity-50 cursor-not-allowed",
					)}
					onClick={onSelectAllByVin}
					disabled={isDisabled}
				>
					<Layers className="h-3.5 w-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isDisabled
					? "Select rows with the same VIN first"
					: "Select all rows for this VIN"}
			</TooltipContent>
		</Tooltip>
	);
}
