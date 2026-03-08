"use client";

import {
	ArrowUpRight,
	Database,
	FileSpreadsheet,
	HardDrive,
	Phone,
	ShoppingCart,
	Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStatsQuery } from "@/hooks/queries/useDashboardStatsQuery";
import { useStorageStats } from "@/hooks/useStorageStats";
import { formatBytesToMB, usagePercent } from "@/lib/storage-limits";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

const CapacityChart = dynamic(
	() => import("@/components/dashboard/CapacityChart"),
	{
		ssr: false,
		loading: () => (
			<div className="h-full w-full bg-white/5 animate-pulse rounded-full" />
		),
	},
);
const DistributionChart = dynamic(
	() => import("@/components/dashboard/DistributionChart"),
	{
		ssr: false,
		loading: () => (
			<div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />
		),
	},
);

export default function DashboardPage() {
	const { data: statsData = [], isLoading: isStageLoading } =
		useDashboardStatsQuery();

	const ordersCount = statsData.filter((row) => row.stage === "orders").length;
	const mainCount = statsData.filter((row) => row.stage === "main").length;
	const bookingCount = statsData.filter(
		(row) => row.stage === "booking",
	).length;
	const archiveCount = statsData.filter(
		(row) => row.stage === "archive",
	).length;

	const callQueueRows = statsData.filter((row) => row.stage === "call");
	const callCount = callQueueRows.length;
	const callUniqueVehicles = new Set(
		callQueueRows.map((item) => item.vin).filter(Boolean),
	).size;

	// Memoize stats to prevent recalculation
	const stats = useMemo(
		() => [
			{
				title: "TOTAL PENDING",
				value: mainCount,
				subtext: `${mainCount} Total Lines`,
				icon: FileSpreadsheet,
			},
			{
				title: "ACTIVE ORDERS",
				value: ordersCount,
				subtext: `${ordersCount} Total Lines`,
				icon: ShoppingCart,
			},
			{
				title: "CALL QUEUE",
				// اللعب كله هنا: بنجيب الـ vin من كل سطر، والـ Set بتطير المتكرر، والـ size بيدينا العدد النهائي
				value: callUniqueVehicles,
				subtext: "Unique Vehicles",
				icon: Phone,
			},
		],
		// خد بالك غيرنا الـ dependency array عشان يحس بأي تغيير في البيانات نفسها
		[mainCount, ordersCount, callUniqueVehicles],
	);

	// Generate calendar data (not memoized so it stays fresh if the page stays open)
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const today = now.getDate();
	const monthName = now.toLocaleString("en-US", { month: "long" });

	const calendarData = { year, month, firstDay, daysInMonth, today, monthName };

	// Storage stats from Supabase
	const { data: storageStats, isLoading: storageLoading } = useStorageStats();

	// Compute pie chart data from real storage metrics
	const pieData = useMemo(() => {
		if (!storageStats) {
			return [
				{ name: "Used", value: 0, color: "#FFCC00" },
				{ name: "Remaining", value: 100, color: "#ffffff10" },
			];
		}

		const usedPercent = usagePercent(
			(storageStats.dbUsedBytes ?? 0) + storageStats.storageUsedBytes,
			storageStats.combinedLimitBytes,
		);

		return [
			{ name: "Used", value: usedPercent, color: "#FFCC00" },
			{
				name: "Remaining",
				value: Math.max(0, 100 - usedPercent),
				color: "#ffffff10",
			},
		];
	}, [storageStats]);

	const barData = useMemo(
		() => [
			{ name: "Orders", value: ordersCount },
			{ name: "Main Sheet", value: mainCount },
			{ name: "Call", value: callCount },
			{ name: "Booking", value: bookingCount },
			{ name: "Archive", value: archiveCount },
		],
		[ordersCount, mainCount, callCount, bookingCount, archiveCount],
	);

	return (
		<div className="space-y-5 pb-8 max-w-[1400px] mx-auto">
			{/* Hero Section */}
			<div className="relative overflow-hidden rounded-3xl bg-black border border-white/5 h-[460px] shadow-xl">
				{/* Full Background Image */}
				<div className="absolute inset-0 bg-[url('/dashboard-car.webp')] bg-cover bg-center" />

				<div className="relative z-20 h-full flex flex-col justify-between p-10">
					<div className="mt-6">
						<div className="flex items-center gap-5 mb-3">
							<div className="w-14 h-14 bg-renault-yellow rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(255,204,0,0.4)]">
								<span className="text-black font-bold text-2xl">R</span>
							</div>
							<div>
								<h1 className="text-4xl font-bold text-white tracking-tight">
									PENDINGSYSTEM
								</h1>
								<p className="text-renault-yellow/90 font-medium tracking-widest text-xs mt-0.5">
									<span>PENDING SYSTEM</span>
								</p>
							</div>
						</div>
					</div>

					{/* Bottom Row: Stats Cards + Calendar */}
					<div className="flex items-end justify-between gap-6">
						{/* Glass Stats Cards Row - Minimized */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
							{stats.map((stat) => (
								<div
									key={stat.title}
									className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 relative group hover:bg-white/10 hover:border-white/20 transition-all duration-200"
								>
									<div className="flex justify-between items-start mb-2">
										<div className="p-1.5 rounded-lg bg-renault-yellow/10 text-renault-yellow">
											<stat.icon className="w-4 h-4" />
										</div>
										<ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-renault-yellow transition-colors" />
									</div>
									<div>
										<p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">
											{stat.title}
										</p>
										<h3 className="text-2xl font-black text-white">
											{stat.value}
										</h3>
										<p className="text-[10px] text-gray-500">{stat.subtext}</p>
									</div>
								</div>
							))}
						</div>

						{/* Glass Calendar Widget - Absolute Bottom Right */}
						<div className="absolute bottom-6 right-6 glass rounded-2xl p-3 min-w-[180px] hidden lg:block opacity-80 hover:opacity-100 transition-opacity duration-300">
							<div className="flex items-center justify-between mb-2">
								<h3 className="text-xs font-semibold text-white">
									{calendarData.monthName}
								</h3>
								<span className="text-[9px] text-gray-500 font-medium">
									{calendarData.year}
								</span>
							</div>
							<div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-gray-500 mb-1">
								{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
									const dayKey = `calendar-header-${d}-${i}`;
									return (
										<span key={dayKey} className="font-bold">
											{d}
										</span>
									);
								})}
							</div>
							<div className="grid grid-cols-7 gap-0.5 text-center text-[9px]">
								{Array.from({ length: 35 }, (_, i) => {
									const day = i - calendarData.firstDay + 1;
									const isToday = day === calendarData.today;
									const isValid = day > 0 && day <= calendarData.daysInMonth;

									return (
										<span
											key={`calendar-day-${i}`}
											className={cn(
												"w-4 h-4 flex items-center justify-center rounded-full",
												isValid
													? "text-gray-500 hover:bg-white/10 cursor-pointer"
													: "text-transparent",
												isToday && "bg-renault-yellow text-black font-bold",
											)}
										>
											{isValid ? day : ""}
										</span>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Suspense
					fallback={
						<Card className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl relative overflow-hidden">
							<CardContent className="p-6">
								<div className="h-[220px] bg-white/5 animate-pulse rounded-lg" />
							</CardContent>
						</Card>
					}
				>
					{/* Storage Capacity Pie Chart */}
					<Card className="group bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-xl hover:border-white/20 hover:shadow-[0_0_30px_-5px_var(--renault-yellow)] hover:shadow-renault-yellow/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
						{/* Subtle ambient radial glow taking up the whole card background, activated on hover */}
						<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-renault-yellow/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

						<CardContent className="p-6 relative z-10">
							<div className="flex items-center gap-2 mb-6">
								<HardDrive className="w-4 h-4 text-renault-yellow/80 group-hover:text-renault-yellow group-hover:drop-shadow-[0_0_8px_rgba(255,204,0,0.8)] transition-all duration-300" />
								<h3 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] uppercase">
									Storage — DB + Files
								</h3>
							</div>

							<div className="flex items-center justify-between">
								{/* Left side: Text Details */}
								<div className="flex-1 space-y-5">
									{storageStats ? (
										<>
											<div className="flex items-center gap-3 group/db cursor-default">
												<div className="p-2.5 bg-white/5 rounded-lg border border-white/5 group-hover/db:border-renault-yellow/20 group-hover/db:bg-renault-yellow/5 transition-colors duration-300">
													<Database className="w-4 h-4 text-renault-yellow/70 group-hover/db:text-renault-yellow transition-colors duration-300" />
												</div>
												<div>
													<p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-1">
														Database
													</p>
													<p className="text-gray-300 font-light text-sm font-sans tabular-nums tracking-tight">
														{storageStats.dbAvailable &&
														storageStats.dbUsedBytes !== null ? (
															`${formatBytesToMB(storageStats.dbUsedBytes)} / 500 MB`
														) : (
															<span className="text-gray-500 font-sans tracking-normal">
																Unavailable
															</span>
														)}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-3 group/files cursor-default">
												<div className="p-2.5 bg-white/5 rounded-lg border border-white/5 group-hover/files:border-renault-yellow/20 group-hover/files:bg-renault-yellow/5 transition-colors duration-300">
													<HardDrive className="w-4 h-4 text-renault-yellow/70 group-hover/files:text-renault-yellow transition-colors duration-300" />
												</div>
												<div>
													<p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mb-1">
														Files
													</p>
													<p className="text-gray-300 font-light text-sm font-sans tabular-nums tracking-tight">
														{storageStats.storageAvailable ? (
															`${formatBytesToMB(storageStats.storageUsedBytes)} / 1 GB`
														) : (
															<span className="text-gray-500 font-sans tracking-normal">
																Unavailable
															</span>
														)}
													</p>
												</div>
											</div>

											{!storageStats.dataComplete && (
												<p className="text-[10px] text-amber-500/80 mt-2">
													⚠ Partial data — some sources unavailable
												</p>
											)}
										</>
									) : (
										<div className="space-y-4">
											<div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
											<div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
										</div>
									)}
								</div>

								{/* Right side: Pie Chart with background ambient glow */}
								<div className="w-[140px] h-[140px] relative flex items-center justify-center shrink-0">
									{/* High-tech intense radial glow specifically directly behind the pie chart */}
									<div className="absolute inset-0 bg-renault-yellow/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0 pointer-events-none" />

									{storageLoading ? (
										<div className="h-[120px] w-[120px] bg-white/5 animate-pulse rounded-full relative z-10" />
									) : (
										<div className="relative z-10 w-full h-full flex items-center justify-center">
											<CapacityChart data={pieData} />
											<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
												<span className="text-[22px] font-bold text-white font-mono leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
													{storageStats
														? usagePercent(
																(storageStats.dbUsedBytes ?? 0) +
																	storageStats.storageUsedBytes,
																storageStats.combinedLimitBytes,
															).toFixed(0) + "%"
														: "—"}
												</span>
												<span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">
													Used
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</Suspense>

				<Suspense
					fallback={
						<Card className="bg-[#0c0c0e] border border-white/10 rounded-xl">
							<CardContent className="p-6">
								<div className="h-[220px] bg-white/5 animate-pulse rounded-lg" />
							</CardContent>
						</Card>
					}
				>
					{/* Bar Chart Distribution */}
					<Card className="bg-[#0c0c0e] border border-white/10 rounded-xl hover:border-white/20 transition-colors duration-200">
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-2">
									<Users className="w-4 h-4 text-renault-yellow" />
									<h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">
										STAGE DISTRIBUTION
									</h3>
								</div>
								<span className="text-[10px] text-gray-500">Live Data</span>
							</div>
							{isStageLoading ? (
								<div className="h-[180px] w-full bg-white/5 animate-pulse rounded-lg" />
							) : (
								<div className="h-[180px] w-full">
									<DistributionChart data={barData} />
								</div>
							)}
						</CardContent>
					</Card>
				</Suspense>
			</div>
		</div>
	);
}
