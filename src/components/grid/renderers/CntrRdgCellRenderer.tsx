"use client";

import type { ICellRendererParams } from "ag-grid-community";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { CntrRdgAlertIcon } from "./CntrRdgAlertIcon";

export const CntrRdgCellRenderer = (
	params: ICellRendererParams<PendingRow>,
) => {
	const data = params.data;
	const { theme } = useTheme();

	const warningNotification = useAppStore((state) =>
		data
			? state.notifications.find(
					(n) => n.type === "cntr_rdg_warning" && n.referenceId === data.id,
				)
			: undefined,
	);

	if (!data) return null;

	const displayValue = data.cntrRdg ? data.cntrRdg.toLocaleString() : "0";

	if (!warningNotification) {
		return <span>{displayValue}</span>;
	}

	const level = warningNotification.cntrRdgLevel;
	// White uses darker shades for contrast on a white grid; Dark is unchanged.
	const iconColor =
		theme === "white"
			? level === "high"
				? "#dc2626"
				: "#a16207"
			: level === "high"
				? "#ef4444"
				: "#eab308";
	const tooltipText =
		level === "high"
			? "High Risk: CNTR RDG approaching 100,000 KM limit"
			: "Early Warning: CNTR RDG over 70,000 KM";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="flex items-center gap-2 px-1">
					{displayValue}
					<CntrRdgAlertIcon color={iconColor} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<p>{tooltipText}</p>
			</TooltipContent>
		</Tooltip>
	);
};
