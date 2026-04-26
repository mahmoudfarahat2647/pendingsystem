import { useMemo } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

interface CallCustomerCounterProps {
	rows: PendingRow[];
	className?: string;
}

/**
 * Displays the count of unique customers (by non-empty VIN) in the call list.
 * Plural-aware: renders "1 Customer" / "N Customers".
 */
export const CallCustomerCounter = ({
	rows,
	className,
}: CallCustomerCounterProps) => {
	const count = useMemo(() => {
		if (!rows || rows.length === 0) return 0;
		const uniqueVINs = new Set(
			rows.map((r) => r.vin?.trim().toUpperCase()).filter(Boolean),
		);
		return uniqueVINs.size;
	}, [rows]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						"flex items-center h-8 px-3 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 transition-all duration-300 group cursor-default select-none",
						className,
					)}
				>
					<div className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
						<div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
							<span className="font-mono text-xs">{count}</span>
							<span className="opacity-70 group-hover:opacity-100">
								{count === 1 ? "Customer" : "Customers"}
							</span>
						</div>
					</div>
				</div>
			</TooltipTrigger>
			<TooltipContent side="top" className="text-xs">
				Unique customers to call
			</TooltipContent>
		</Tooltip>
	);
};
