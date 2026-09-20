"use client";

import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	type BookingActivityIndex,
	isBookingDateActive,
} from "@/domain/booking/bookingInquiry";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

interface BookingCalendarGridProps {
	currentMonth: Date;
	selectedDate: Date;
	onMonthChange: (date: Date) => void;
	onDateSelect: (date: Date) => void;
	bookingsByDateMap: Record<string, PendingRow[]>;
	searchQuery: string;
	searchMatchDates: Set<string>;
	activeCustomerDateSet: Set<string>;
	/**
	 * Booking activity classified from the active booking stage.
	 *
	 * Supplied only by the Booking Inquiry. When omitted — which is how the booking flow
	 * calls this component — every badge keeps the standard solid accent and day buttons
	 * keep their existing markup, so the booking flow renders exactly as before.
	 */
	activityIndex?: BookingActivityIndex;
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
	activityIndex,
}: BookingCalendarGridProps) => {
	// Inquiry mode is opt-in: without the prop, nothing below changes.
	const isInquiry = activityIndex !== undefined;
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
					aria-label={isInquiry ? "Previous month" : undefined}
					onClick={() => onMonthChange(subMonths(monthStart, 1))}
					className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
				>
					<ChevronLeft className="h-6 w-6" />
				</button>
				<h2 className="text-2xl font-light text-white tracking-widest uppercase">
					{format(currentMonth, "MMMM yyyy")}
				</h2>
				<button
					type="button"
					aria-label={isInquiry ? "Next month" : undefined}
					onClick={() => onMonthChange(addMonths(monthStart, 1))}
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
					const _hasBookings = !!bookingsByDateMap[dateKey];
					const isSearchMatch = searchQuery && searchMatchDates.has(dateKey);
					const isSelected = isSameDay(day, selectedDate);
					const isCurrentMonth = isSameMonth(day, monthStart);
					const isFaded = searchQuery && !isSearchMatch;
					const isActiveCustomerDate = activeCustomerDateSet.has(dateKey);

					const dayBookings = [...(bookingsByDateMap[dateKey] || [])];

					// Archived-only days are muted AND outlined-with-dashes, so the
					// distinction survives greyscale and colour-blindness rather than
					// resting on hue alone.
					const isArchivedOnlyDay =
						activityIndex !== undefined &&
						dayBookings.length >= 1 &&
						!isBookingDateActive(activityIndex, dateKey);

					const dayLabel = isInquiry
						? `${format(day, "d MMMM yyyy")}, ${dayBookings.length} booked ${
								dayBookings.length === 1 ? "vehicle" : "vehicles"
							}${
								dayBookings.length === 0
									? ""
									: isArchivedOnlyDay
										? ", all archived"
										: ", includes active bookings"
							}`
						: undefined;

					return (
						<button
							type="button"
							key={day.toString()}
							aria-label={dayLabel}
							aria-current={isInquiry && isSelected ? "date" : undefined}
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
							{dayBookings.length >= 1 && !isFaded && (
								<div
									className={cn(
										"absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full shadow-lg z-20",
										isArchivedOnlyDay
											? "bg-transparent text-gray-400 border border-dashed border-gray-500"
											: "bg-renault-yellow text-black border border-[#1c1c1e]",
									)}
								>
									{dayBookings.length}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};
