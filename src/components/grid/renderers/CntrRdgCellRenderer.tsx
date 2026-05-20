"use client";

import type { ICellRendererParams } from "ag-grid-community";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

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
	const pulseClass = level === "high" ? "cntr-pulse-red" : "cntr-pulse-yellow";
	const tooltipText =
		level === "high"
			? "High Risk: CNTR RDG approaching 100,000 KM limit"
			: "Early Warning: CNTR RDG over 70,000 KM";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className={`px-1 ${pulseClass}`}>{displayValue}</span>
				</TooltipTrigger>
				<TooltipContent>
					<p>{tooltipText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
