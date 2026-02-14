import React from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

interface InfoLabelProps {
	data: PendingRow | null;
}

interface PartStatusBadgeProps {
	classNameParts: Array<string | string[] | false>;
	style?: React.CSSProperties;
}

const normalizePartStatusColor = (color: string): string => {
	if (!color.startsWith("#") && color.startsWith("text-")) {
		return color.replace("text-", "bg-");
	}

	return color;
};

const getPartStatusBadgeProps = (color: string): PartStatusBadgeProps => {
	if (color.startsWith("#")) {
		return {
			classNameParts: [],
			style: {
				backgroundColor: `${color}1A`,
				borderColor: `${color}33`,
				color,
			},
		};
	}

	if (color.includes(" ")) {
		return {
			classNameParts: [color],
		};
	}

	return {
		classNameParts: [
			`${color.replace("bg-", "border-").split(" ")[0]}/20`,
			color.replace("bg-", "text-").split(" ")[0],
			color.includes("/") ? color : `${color}/10`,
		],
	};
};

export const InfoLabel = React.memo(({ data }: InfoLabelProps) => {
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);
	const partStatuses = useAppStore((state) => state.partStatuses);
	const {
		customerName = "-",
		vin = "-",
		mobile = "-",
		cntrRdg = "-",
		model = "-",
		partNumber = "-",
		description = "-",
		repairSystem = "-",
		remainTime = "-",
		status = "-",
		bookingStatus,
	} = data || {};

	const statusDef = bookingStatus
		? bookingStatuses.find((s) => s.label === bookingStatus)
		: null;
	const statsColor = statusDef?.color || "bg-renault-yellow";

	const partStatusDef = data?.partStatus
		? partStatuses.find((s) => s.label === data.partStatus)
		: null;
	// Default to cyan hex if not found, to ensure colorful fallback
	const partStatsColor = normalizePartStatusColor(partStatusDef?.color || "#06b6d4");
	const partStatusBadgeProps = getPartStatusBadgeProps(partStatsColor);

	const _bgOpacity = statsColor.includes("/") ? "" : "/10";
	const _borderOpacity = statsColor.includes("/") ? "" : "/20";

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
						<div className="flex items-center gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-24 shrink-0">
								order stats :
							</span>
							<span
								className={cn(
									"px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest transition-all duration-300",
									`${statsColor.replace("bg-", "border-").split(" ")[0]}/20`,
									statsColor.replace("bg-", "text-").split(" ")[0],
									statsColor.includes("/") ? statsColor : `${statsColor}/10`,
									"bg-opacity-10",
								)}
							>
								{bookingStatus || status}
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
						<div className="flex items-center gap-2" suppressHydrationWarning>
							<span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold w-24 shrink-0">
								part state :
							</span>
							{data?.partStatus ? (
								<span
									className={cn(
										"px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest transition-all duration-300",
										...partStatusBadgeProps.classNameParts,
									)}
									style={partStatusBadgeProps.style}
								>
									{data.partStatus}
								</span>
							) : (
								<span className="text-xs text-gray-600 italic">No Status</span>
							)}
						</div>
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
