import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

interface BookingSidebarCustomerListProps {
	searchQuery: string;
	sidebarGroupedBookings: PendingRow[];
	selectedBookingId: string | null;
	setSelectedBookingId: (id: string | null) => void;
}

export const BookingSidebarCustomerList = ({
	searchQuery,
	sidebarGroupedBookings,
	selectedBookingId,
	setSelectedBookingId,
}: BookingSidebarCustomerListProps) => {
	return (
		<div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
			<h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 sticky top-0 bg-[#0a0a0b] py-2 z-10">
				{searchQuery ? "Search Results" : "Customers"}
			</h4>
			<div className="space-y-2">
				{sidebarGroupedBookings.length === 0 ? (
					<p className="text-xs text-gray-700 italic">No bookings found.</p>
				) : (
					sidebarGroupedBookings.map((booking) => (
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
								{booking.customerName}
							</span>
							{searchQuery && booking.bookingDate && (
								<span className="text-[9px] font-mono text-gray-600">
									{format(new Date(booking.bookingDate), "MMM d")}
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
					))
				)}
			</div>
		</div>
	);
};
