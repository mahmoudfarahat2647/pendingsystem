import { useMemo } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

interface VINLineCounterProps {
	rows: PendingRow[];
	className?: string;
}

export const VINLineCounter = ({ rows, className }: VINLineCounterProps) => {
	const counts = useMemo(() => {
		if (!rows || rows.length === 0) return { vins: 0, lines: 0 };

		const uniqueVINs = new Set(rows.map((r) => r.vin).filter(Boolean));
		return {
			vins: uniqueVINs.size,
			lines: rows.length,
		};
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
						<div className="flex items-center gap-1.5 text-emerald-500 group-hover:text-emerald-400 transition-colors">
							<span className="font-mono text-xs">{counts.vins}</span>
							<span className="opacity-70 group-hover:opacity-100">VIN</span>
						</div>

						<div className="w-px h-3 bg-white/10 group-hover:bg-white/20 transition-colors" />

						<div className="flex items-center gap-1.5 text-indigo-400 group-hover:text-indigo-300 transition-colors">
							<span className="font-mono text-xs">{counts.lines}</span>
							<span className="opacity-70 group-hover:opacity-100">Lines</span>
						</div>
					</div>
				</div>
			</TooltipTrigger>
			<TooltipContent side="top" className="text-xs">
				Unique VINs | Total Lines
			</TooltipContent>
		</Tooltip>
	);
};
