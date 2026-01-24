"use client";

import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus, PendingRow } from "@/types";

interface BookingCalendarGridProps {
	currentMonth: Date;
	selectedDate: Date;
	onMonthChange: (date: Date) => void;
	onDateSelect: (date: Date) => void;
	bookingsByDateMap: Record<string, PendingRow[]>;
	searchQuery: string;
	searchMatchDates: Set<string>;
	activeCustomerDateSet: Set<string>;
	activeBookingRep?: PendingRow;
	previewBookings?: PendingRow[];
	previewStatus?: string;
}

export const BookingCalendarGrid = ({
	currentMonth,
	selectedDate,
	onMonthChange,
	onDateSelect,
	bookingsByDateMap,
	searchQuery,
	searchMatchDates,
	activeCustomerDateSet,
	activeBookingRep,
	previewBookings,
	previewStatus,
}: BookingCalendarGridProps) => {
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(monthStart);
	const startDate = startOfWeek(monthStart);
	const endDate = endOfWeek(monthEnd);

	const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

	return (
		<div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
			<div className="flex items-center justify-between mb-8">
				<button
					type="button"
					onClick={() =>
						onMonthChange(
							new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)),
						)
					}
					className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
				>
					<ChevronLeft className="h-6 w-6" />
				</button>
				<h2 className="text-2xl font-light text-white tracking-widest uppercase">
					{format(currentMonth, "MMMM yyyy")}
				</h2>
				<button
					type="button"
					onClick={() =>
						onMonthChange(
							new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)),
						)
					}
					className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
				>
					<ChevronRight className="h-6 w-6" />
				</button>
			</div>

			<div className="grid grid-cols-7 mb-6">
				{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
					<div
						key={day}
						className="text-center text-[10px] font-medium text-gray-600 uppercase tracking-[0.2em]"
					>
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-3">
				{calendarDays.map((day) => {
					const dateKey = format(day, "yyyy-MM-dd");
					const hasBookings = !!bookingsByDateMap[dateKey];
					const isSearchMatch = searchQuery && searchMatchDates.has(dateKey);
					const isSelected = isSameDay(day, selectedDate);
					const isCurrentMonth = isSameMonth(day, monthStart);
					const isFaded = searchQuery && !isSearchMatch;
					const isActiveCustomerDate = activeCustomerDateSet.has(dateKey);

					const dayBookings = [...(bookingsByDateMap[dateKey] || [])];
					const isGhostDay =
						isSelected && !searchQuery && (previewBookings?.length ?? 0) > 0;

					if (isGhostDay && previewBookings) {
						previewBookings.forEach((pb) => {
							if (!dayBookings.find((b) => b.id === pb.id)) {
								dayBookings.push({
									...pb,
									bookingStatus: previewStatus || "Pending",
									isGhost: true,
								} as any);
							}
						});
					}

					const customerGroups = Array.from(
						new Set(dayBookings.map((b) => b.vin)),
					).slice(0, 3);

					return (
						<button
							type="button"
							key={day.toString()}
							onClick={() => onDateSelect(day)}
							className={cn(
								"relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 group",
								!isCurrentMonth
									? "text-gray-800"
									: "text-gray-400 hover:text-white",
								isSelected
									? searchQuery
										? "ring-2 ring-emerald-500 text-emerald-400 bg-emerald-500/10"
										: "ring-1 ring-white/50 text-white bg-white/10"
									: "hover:bg-white/5",
								isSearchMatch && !isSelected && "text-emerald-500 font-bold",
								isFaded && !isSelected && "opacity-20 pointer-events-none",
								isActiveCustomerDate &&
								!isSelected &&
								!isFaded &&
								"ring-1 ring-emerald-500/40 text-emerald-500",
							)}
						>
							{format(day, "d")}
							{dayBookings.length >= 2 && !isFaded && (
								<div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-renault-yellow text-black text-[10px] font-bold rounded-full shadow-lg border border-[#050505] z-20">
									{dayBookings.length}
								</div>
							)}
							{dayBookings.length === 1 && !isFaded && (
								<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
									<div
										className={cn(
											"w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg",
											isActiveCustomerDate && "ring-2 ring-white/60 scale-125",
										)}
									/>
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
