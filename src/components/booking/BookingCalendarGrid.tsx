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
	bookingStatuses: BookingStatus[];
	activeBookingRep?: PendingRow;
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
	bookingStatuses,
	activeBookingRep,
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

					const dayBookings = bookingsByDateMap[dateKey] || [];
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
							{hasBookings && !isFaded && (
								<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center h-3 w-8">
									{customerGroups.map((vin, idx) => {
										const customerBooking = dayBookings.find(
											(b) => b.vin === vin,
										);
										const statusColor = customerBooking
											? bookingStatuses.find(
												(s) => s.label === customerBooking.bookingStatus,
											)?.color || "bg-emerald-500/80"
											: "bg-emerald-500/80";

										const isHex =
											statusColor.startsWith("#") || statusColor.startsWith("rgb");

										return (
											<div
												key={vin}
												style={{
													zIndex: 10 - idx,
													transform: `translateX(${(idx - (customerGroups.length - 1) / 2) * 6}px)`,
													backgroundColor: isHex ? statusColor : undefined,
												}}
												className={cn(
													"absolute w-3 h-3 rounded-full shadow-lg transition-all duration-300 border border-black/20",
													!isHex && statusColor,
													isActiveCustomerDate && vin === activeBookingRep?.vin
														? "ring-1 ring-white/60 scale-110"
														: "",
													isSelected && "ring-1 ring-white/30",
												)}
											/>
										);
									})}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
