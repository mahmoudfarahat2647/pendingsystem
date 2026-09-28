"use client";

import { CalendarSearch } from "lucide-react";
import { useState } from "react";
import { useTodayBookingCount } from "@/hooks/useTodayBookingCount";
import { cn } from "@/lib/utils";
import { BookingInquiryModal } from "./BookingInquiryModal";

/**
 * Header entry point for the Booking Inquiry.
 *
 * Carries a green count badge of today's booked vehicles, from `useTodayBookingCount`.
 * That hook reads the Header's existing notification-candidate cache rather than issuing
 * its own query, so this button still adds no fetch of its own to every page load. The
 * modal itself is still mounted only while open — `useBookingCalendar` issues its stage
 * queries unconditionally, so a permanently mounted modal would add two queries to every
 * page load across the application. The badge does not clear on open; it only changes
 * when a booked line leaves today (a saved action) or the local day rolls over.
 *
 * Carries no `title` tooltip by design. The `aria-label` renders nothing visually and
 * is what names the icon button for assistive technology.
 */
export const BookingInquiryButton = () => {
	const [isOpen, setIsOpen] = useState(false);
	const todayCount = useTodayBookingCount();

	return (
		<>
			<button
				type="button"
				suppressHydrationWarning
				onClick={() => setIsOpen(true)}
				aria-label={
					todayCount > 0
						? `Booking schedule, ${todayCount} booked today`
						: "Booking schedule"
				}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				className={cn(
					"relative p-2.5 rounded-xl transition-all border",
					isOpen
						? "text-white bg-white/10 border-white/20"
						: "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10",
				)}
			>
				<CalendarSearch className="h-5 w-5" />
				{todayCount > 0 && (
					<div className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-emerald-500 rounded-full border-2 border-[#0a0a0b] flex items-center justify-center">
						<span className="text-[9px] font-bold text-white leading-none">
							{todayCount > 9 ? "9+" : todayCount}
						</span>
					</div>
				)}
			</button>

			{isOpen && <BookingInquiryModal open={isOpen} onOpenChange={setIsOpen} />}
		</>
	);
};
