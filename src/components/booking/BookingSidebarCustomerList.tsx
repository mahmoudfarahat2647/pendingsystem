import { ChevronRight } from "lucide-react";
import {
	type BookingActivityIndex,
	isBookedVehicleArchived,
} from "@/domain/booking/bookingInquiry";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";
import { safeFormatDate } from "@/utils/safeFormatDate";

interface BookingSidebarCustomerListProps {
	searchQuery: string;
	sidebarGroupedBookings: PendingRow[];
	selectedBookingId: string | null;
	setSelectedBookingId: (id: string | null) => void;
	/**
	 * Booking activity classified from the active booking stage.
	 *
	 * Supplied only by the Booking Inquiry, where the calendar's colour cue is no longer
	 * visible once a day has been opened. When omitted — how the booking flow calls this —
	 * no tag renders and output is unchanged.
	 */
	activityIndex?: BookingActivityIndex;
}

export const BookingSidebarCustomerList = ({
	searchQuery,
	sidebarGroupedBookings,
	selectedBookingId,
	setSelectedBookingId,
	activityIndex,
}: BookingSidebarCustomerListProps) => {
	return (
		<div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
			<h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 sticky top-0 bg-[#1c1c1e] py-2 z-10">
				{searchQuery ? "Search Results" : "Customers"}
			</h4>
			<div className="space-y-2">
				{sidebarGroupedBookings.length === 0 ? (
					<p className="text-xs text-gray-700 italic">No bookings found.</p>
				) : (
					sidebarGroupedBookings.map((booking) => {
						const isArchived =
							activityIndex !== undefined &&
							isBookedVehicleArchived(activityIndex, booking);

						return (
							<button
								type="button"
								key={booking.id}
								onClick={() => setSelectedBookingId(booking.id)}
								className={cn(
									"w-full text-left p-3 rounded-lg border transition-all duration-200 group flex items-center justify-between",
									selectedBookingId === booking.id
										? "bg-white/5 border-white/10 text-white"
										: "border-transparent hover:bg-white/[0.02] text-gray-500",
								)}
							>
								<span className="text-sm font-medium truncate">
									{/* Names are predominantly Arabic; isolate them so the adjacent
								    Archived tag cannot reorder the line. Only applied in inquiry
								    mode, leaving the booking flow's markup untouched. */}
									{activityIndex !== undefined ? (
										<bdi>{booking.customerName}</bdi>
									) : (
										booking.customerName
									)}
								</span>
								{isArchived && (
									<span className="ml-2 shrink-0 rounded border border-dashed border-gray-600 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-500">
										Archived
									</span>
								)}
								{searchQuery && booking.bookingDate && (
									<span className="text-[9px] font-mono text-gray-600">
										{safeFormatDate(booking.bookingDate, "MMM d")}
									</span>
								)}
								{!searchQuery && (
									<ChevronRight
										className={cn(
											"h-3 w-3 opacity-0 group-hover:opacity-100",
											selectedBookingId === booking.id && "opacity-100",
										)}
									/>
								)}
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};
