"use client";

import {
	ArrowUpRight,
	Calculator,
	Calendar,
	FileSpreadsheet,
	Phone,
	ShoppingCart,
	TrendingUp,
	Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
const CapacityChart = dynamic(() => import("@/components/dashboard/CapacityChart"), {
	ssr: false,
	loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-full" />,
});
const DistributionChart = dynamic(() => import("@/components/dashboard/DistributionChart"), {
	ssr: false,
	loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />,
});
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getCalculatorValues } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import { WarrantyDatePicker } from "@/components/dashboard/WarrantyDatePicker";

export default function DashboardPage() {
	const ordersRowData = useAppStore((state) => state.ordersRowData);
	const rowData = useAppStore((state) => state.rowData);
	const callRowData = useAppStore((state) => state.callRowData);

	const [warrantyDate, setWarrantyDate] = useState("");
	const [warrantyResult, setWarrantyResult] = useState<ReturnType<
		typeof getCalculatorValues
	> | null>(null);

	// Memoize stats to prevent recalculation
	const stats = useMemo(
		() => [
			{
				title: "TOTAL PENDING",
				value: rowData.length,
				subtext: `${rowData.length} Total Lines`,
				icon: FileSpreadsheet,
			},
			{
				title: "ACTIVE ORDERS",
				value: ordersRowData.length,
				subtext: `${ordersRowData.length} Total Lines`,
				icon: ShoppingCart,
			},
			{
				title: "CALL QUEUE",
				value: callRowData.length,
				subtext: "Waiting List",
				icon: Phone,
			},
		],
		[rowData.length, ordersRowData.length, callRowData.length],
	);

	// Memoize calendar data
	const calendarData = useMemo(() => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const today = now.getDate();
		const monthName = now.toLocaleString("en-US", { month: "long" });

		return { year, month, firstDay, daysInMonth, today, monthName };
	}, []);

	// Memoize chart data
	const pieData = useMemo(
		() => [
			{ name: "Capacity", value: 25, color: "#FFCC00" },
			{ name: "Remaining", value: 75, color: "#ffffff10" },
		],
		[],
	);

	const barData = useMemo(
		() => [
			{ name: "Order Confirm", value: 12 },
			{ name: "Arrivals", value: 19 },
			{ name: "Delivery", value: 8 },
			{ name: "Returns", value: 3 },
		],
		[],
	);

	// Auto-calculate warranty when date changes
	React.useEffect(() => {
		if (warrantyDate) {
			const result = getCalculatorValues(warrantyDate);
			setWarrantyResult(result);
		}
	}, [warrantyDate]);

	return (
		<div className="space-y-5 pb-8 max-w-[1400px] mx-auto">
			{/* Hero Section */}
			<div className="relative overflow-hidden rounded-3xl bg-[#0a0a0b] border border-white/[0.06] h-[460px] shadow-xl">
				{/* Full Background Image */}
				<div className="absolute inset-0 bg-[url('/dashboard-car.jpg')] bg-cover bg-center" />

				{/* Subtle Gradient Overlays for Depth */}
				<div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20 z-[1]" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-[2]" />
				<div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-transparent z-[3]" />

				{/* Subtle Yellow Glow at Bottom */}
				<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-renault-yellow/5 to-transparent z-[4]" />

				<div className="relative z-20 h-full flex flex-col justify-between p-10">
					<div className="mt-6">
						<div className="flex items-center gap-5 mb-3">
							<div className="w-14 h-14 bg-renault-yellow rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(255,204,0,0.4)]">
								<span className="text-black font-bold text-2xl">R</span>
							</div>
							<div>
								<h1 className="text-4xl font-bold text-white tracking-tight">
									RENAULT
								</h1>
								<p className="text-renault-yellow/90 font-medium tracking-[0.3em] text-xs mt-0.5">
									PENDING SYSTEM
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
									className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 relative group hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200"
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
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Capacity Pie Chart */}
				<Card className="bg-[#0c0c0e] border border-white/[0.08] rounded-xl hover:border-white/12 transition-colors duration-200">
					<CardContent className="p-6 relative">
						<div className="flex items-center gap-2 mb-6">
							<TrendingUp className="w-4 h-4 text-renault-yellow" />
							<h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">
								CAPACITY
							</h3>
						</div>
						<div className="h-[180px] w-full relative flex items-center justify-center">
							<CapacityChart data={pieData} />
							<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
								<span className="text-2xl font-bold text-white">25</span>
								<span className="text-xs text-gray-500">Total</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Bar Chart Distribution */}
				<Card className="bg-[#0c0c0e] border border-white/[0.08] rounded-xl hover:border-white/12 transition-colors duration-200">
					<CardContent className="p-6 relative">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-2">
								<Users className="w-4 h-4 text-renault-yellow" />
								<h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">
									TOP PARTS DISTRIBUTION
								</h3>
							</div>
							<span className="text-[10px] text-gray-500">Live Data</span>
						</div>
						<div className="h-[180px] w-full">
							<DistributionChart data={barData} />
						</div>
					</CardContent>
				</Card>

				{/* Warranty Calculator */}
				<Card className="bg-[#0c0c0e] border border-white/[0.08] rounded-xl hover:border-white/12 transition-colors duration-200">
					<CardContent className="p-5">
						{/* Header */}
						<div className="flex items-start justify-between mb-1">
							<div className="flex items-center gap-2">
								<div className="p-1.5 rounded bg-renault-yellow/10">
									<Calculator className="w-4 h-4 text-renault-yellow" />
								</div>
								<h3 className="text-sm font-semibold text-white">
									Warranty Calculator
								</h3>
							</div>
							<span
								className={cn(
									"text-[10px] font-bold px-2 py-0.5 rounded",
									warrantyResult
										? warrantyResult.expired
											? "bg-red-500/20 text-red-500"
											: "bg-renault-yellow/20 text-renault-yellow"
										: "bg-renault-yellow/20 text-renault-yellow",
								)}
							>
								{warrantyResult
									? warrantyResult.expired
										? "EXPIRED"
										: "VALID"
									: "VALID"}
							</span>
						</div>

						{/* Subtitle */}
						<p className="text-[10px] text-gray-500 mb-5 ml-8">
							Calculate 3-year term instantly
						</p>

						{/* Input Section */}
						<div className="space-y-4">
							<div>
								<Label
									htmlFor="warranty-date"
									className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block"
								>
									START DATE (D/M)
								</Label>
								<div className="relative">
									<WarrantyDatePicker
										id="warranty-date"
										value={warrantyDate}
										onChange={(value) => setWarrantyDate(value)}
									/>
								</div>
							</div>

							{/* Result Boxes - Always visible */}
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 rounded-lg bg-[#1a1a1c] border border-white/[0.06]">
									<p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
										END DATE
									</p>
									<p className="text-sm font-medium text-white">
										{warrantyResult ? warrantyResult.endDate : "—"}
									</p>
								</div>
								<div className="p-3 rounded-lg bg-[#1a1a1c] border border-white/[0.06]">
									<p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
										REMAINING
									</p>
									<p
										className={cn(
											"text-sm font-medium",
											warrantyResult
												? warrantyResult.expired
													? "text-red-500"
													: "text-white"
												: "text-white",
										)}
									>
										{warrantyResult ? warrantyResult.remainTime : "—"}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
