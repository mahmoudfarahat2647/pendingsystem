"use client";

import { FileCheck } from "lucide-react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

interface MoveToMainButtonProps {
	onClick: () => void;
	disabled: boolean;
	/** Overrides the default tooltip, e.g. to explain why the button is disabled. */
	tooltip?: string;
	className?: string;
	iconClassName?: string;
}

/**
 * Toolbar button for the "Move to Main Sheet" action (issue #314). Rendered
 * only by callers whose `moveToMainPermission` Settings switch is on.
 */
export function MoveToMainButton({
	onClick,
	disabled,
	tooltip,
	className,
	iconClassName = "h-3.5 w-3.5",
}: MoveToMainButtonProps) {
	const { t, lang } = useT();
	const label = t("modals.moveToMain.action");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					size="icon"
					variant="ghost"
					aria-label={label}
					className={cn(
						"text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 w-8",
						className,
					)}
					disabled={disabled}
					onClick={onClick}
				>
					<FileCheck className={iconClassName} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<LocalizedScope lang={lang}>{tooltip ?? label}</LocalizedScope>
			</TooltipContent>
		</Tooltip>
	);
}
