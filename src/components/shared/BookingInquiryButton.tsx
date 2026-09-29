"use client";

import { CalendarSearch } from "lucide-react";
import { useState } from "react";
import { useTodayBookingCount } from "@/hooks/useTodayBookingCount";
import { BookingInquiryModal } from "./BookingInquiryModal";
import { HeaderCountBadge, headerIconButtonClass } from "./HeaderIconButton";

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
				className={headerIconButtonClass(isOpen)}
			>
				<CalendarSearch className="h-5 w-5" />
				<HeaderCountBadge
					count={todayCount}
					className="bg-emerald-500 hover:bg-emerald-500"
				/>
			</button>

			{isOpen && <BookingInquiryModal open={isOpen} onOpenChange={setIsOpen} />}
		</>
	);
};
