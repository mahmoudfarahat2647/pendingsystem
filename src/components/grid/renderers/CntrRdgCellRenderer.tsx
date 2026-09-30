"use client";

import type { ICellRendererParams } from "ag-grid-community";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { CntrRdgAlertIcon } from "./CntrRdgAlertIcon";

export const CntrRdgCellRenderer = (
	params: ICellRendererParams<PendingRow>,
) => {
	const data = params.data;

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
	// Icon draws in currentColor; White uses darker shades for contrast on a
	// white grid, Dark keeps the original colours.
	const iconColorClass =
		level === "high"
			? "text-[#dc2626] dark:text-[#ef4444]"
			: "text-[#a16207] dark:text-[#eab308]";
	const tooltipText =
		level === "high"
			? "High Risk: CNTR RDG approaching 100,000 KM limit"
			: "Early Warning: CNTR RDG over 70,000 KM";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="flex items-center gap-2 px-1">
					{displayValue}
					<span className={iconColorClass}>
						<CntrRdgAlertIcon color="currentColor" />
					</span>
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<p>{tooltipText}</p>
			</TooltipContent>
		</Tooltip>
	);
};
