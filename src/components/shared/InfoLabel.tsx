import { format } from "date-fns";
import React from "react";
import { calculateRemainingTime, cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

interface InfoLabelProps {
	data: PendingRow | null;
}

export const InfoLabel = React.memo(({ data }: InfoLabelProps) => {
	const {
		customerName = "-",
		vin = "-",
		mobile = "-",
		model = "-",
		partNumber = "-",
		description = "-",
		repairSystem = "-",
		startWarranty = "",
		endWarranty = "",
	} = data || {};

	const remainTime = endWarranty ? calculateRemainingTime(endWarranty) : "-";

	const fmtDate = (d: string) => {
		if (!d) return "—";
		try {
			const parsed = d.includes("T") ? new Date(d) : new Date(`${d}T00:00:00`);
			return format(parsed, "MMM d, yyyy");
		} catch {
			return d;
		}
	};

	return (
		<div className="w-full relative group">
			{/* Animated Gradient Border */}
			<div className="absolute -inset-0.5 bg-gradient-to-r from-renault-yellow/20 via-white/10 to-cyan-500/20 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

			<div className="w-full bg-[#0a0a0b]/90 backdrop-blur-xl rounded-lg border border-white/10 p-3 shadow-xl relative overflow-hidden">
				{/* Ambient Background Glow */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-renault-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-6 relative z-10 font-[family-name:var(--font-geist-sans)]"
					suppressHydrationWarning
				>
					{/* Column 1: Customer & VIN */}
					<div className="space-y-1" suppressHydrationWarning>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-16 shrink-0">
								name :
							</span>
							<span className="text-sm font-medium text-gray-100 tracking-wide truncate shadow-black drop-shadow-sm">
								{customerName}
							</span>
						</div>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-16 shrink-0">
								vin :
							</span>
							<span className="text-sm font-black text-green-500 tracking-widest font-mono truncate drop-shadow-md">
								{vin}
							</span>
						</div>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-16 shrink-0">
								model :
							</span>
							<span className="text-sm font-bold text-cyan-400 tracking-wide truncate drop-shadow-sm">
								{model}
							</span>
						</div>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-16 shrink-0">
								mobile :
							</span>
							<span className="text-sm font-mono text-gray-300 tracking-wide truncate">
								{mobile}
							</span>
						</div>
					</div>

					{/* Column 2: Part Details */}
					<div className="space-y-1" suppressHydrationWarning>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-20 shrink-0">
								part des. :
							</span>
							<span className="text-sm font-medium text-gray-200 tracking-wide truncate">
								{description}
							</span>
						</div>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-20 shrink-0">
								part no. :
							</span>
							<span className="text-sm font-mono text-gray-300 tracking-wider truncate bg-white/5 px-1 rounded">
								{partNumber}
							</span>
						</div>
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-20 shrink-0">
								stats :
							</span>
							<span className="text-sm font-medium text-gray-200 tracking-wide truncate">
								{data?.status || "-"}
							</span>
						</div>
					</div>

					{/* Column 3: Warranty & Part State */}
					<div className="space-y-1" suppressHydrationWarning>
						{repairSystem !== "ضمان" && (
							<div
								className="flex items-baseline gap-2"
								suppressHydrationWarning
							>
								<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-24 shrink-0">
									warranty :
								</span>
								<span
									className={`text-sm font-bold tracking-wide truncate ${remainTime === "Expired" ? "text-red-500 drop-shadow-sm" : "text-green-400 drop-shadow-sm"}`}
								>
									{remainTime}
								</span>
							</div>
						)}
						<div className="flex items-baseline gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-24 shrink-0">
								system :
							</span>
							<span className="text-sm font-medium text-gray-200 tracking-wide truncate">
								{repairSystem}
							</span>
						</div>
						{repairSystem === "ضمان" && (
							<>
								<div
									className="flex items-baseline gap-2"
									suppressHydrationWarning
								>
									<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-20 shrink-0">
										icm start :
									</span>
									<span className="text-sm font-mono text-cyan-400 tracking-wide truncate">
										{fmtDate(startWarranty)}
									</span>
								</div>
								<div
									className="flex items-baseline gap-2"
									suppressHydrationWarning
								>
									<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-20 shrink-0">
										icm end :
									</span>
									<span className="text-sm font-mono text-cyan-400 tracking-wide truncate">
										{fmtDate(endWarranty)}
									</span>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Footer: Warranty Status (when Repair System is "ضمان") */}
				{repairSystem === "ضمان" && (
					<div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black">
								Warranty Status :
							</span>
							<span
								className={cn(
									"px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner",
									remainTime === "Expired"
										? "bg-red-500/10 border-red-500/20 text-red-500"
										: "bg-green-500/10 border-green-500/20 text-green-400",
								)}
							>
								{remainTime}
							</span>
						</div>
						<div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest animate-pulse">
							[ Warranty Secured ]
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
