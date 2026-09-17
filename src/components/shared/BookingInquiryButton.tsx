"use client";

import { CalendarSearch } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookingInquiryModal } from "./BookingInquiryModal";

/**
 * Header entry point for the Booking Inquiry.
 *
 * Holds no data hooks of its own, and mounts the modal only while it is open —
 * `useBookingCalendar` issues its stage queries unconditionally, so a permanently
 * mounted modal would add two queries to every page load across the application.
 *
 * Carries no `title` tooltip by design. The `aria-label` renders nothing visually and
 * is what names the icon button for assistive technology.
 */
export const BookingInquiryButton = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				suppressHydrationWarning
				onClick={() => setIsOpen(true)}
				aria-label="Booking schedule"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				className={cn(
					"p-2.5 rounded-xl transition-all border",
					isOpen
						? "text-white bg-white/10 border-white/20"
						: "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10",
				)}
			>
				<CalendarSearch className="h-5 w-5" />
			</button>

			{isOpen && <BookingInquiryModal open={isOpen} onOpenChange={setIsOpen} />}
		</>
	);
};
