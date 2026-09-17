"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { BookingCalendarGrid } from "../booking/BookingCalendarGrid";
import { BookingSidebarCustomerList } from "../booking/BookingSidebarCustomerList";
import { BookingSidebarDetails } from "../booking/BookingSidebarDetails";
import { BookingSidebarHeader } from "../booking/BookingSidebarHeader";
import { useBookingCalendar } from "../booking/hooks/useBookingCalendar";

interface BookingInquiryModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Booking Inquiry: a read-only calendar answering "who is booked, and when".
 *
 * Composes the same components as {@link BookingCalendarModal} but omits every control
 * that writes — the confirm footer, the booking checklist, and note entry. It also passes
 * no notes, so the notes popover never renders.
 *
 * This component must only be rendered while open. `useBookingCalendar` issues its stage
 * queries unconditionally, so keeping it mounted would add two queries to every page load
 * across the application.
 */
export const BookingInquiryModal = ({
	open,
	onOpenChange,
}: BookingInquiryModalProps) => {
	const {
		currentMonth,
		setCurrentMonth,
		selectedDate,
		searchQuery,
		selectedBookingId,
		setSelectedBookingId,
		searchMatchDates,
		bookingsByDateMap,
		bookingActivityIndex,
		sidebarGroupedBookings,
		activeBookingRep,
		activeCustomerBookings,
		activeCustomerHistoryDates,
		handleDateSelect,
		isLoadingBookings,
		hasBookingLoadError,
		isBookingDataComplete,
		retryBookingLoad,
	} = useBookingCalendar({
		open,
		initialSearchTerm: "",
		// Selecting a customer must never move the day the user chose. A date-first
		// inquiry that jumps to a vehicle's latest visit defeats its own purpose.
		suppressHistoryJump: true,
	});

	// "Absent from the active index" only means archived once the booking stage has
	// actually loaded. While loading or after a failure we withhold the classification
	// props entirely, so nothing is asserted to be finished work on missing data.
	const classification = isBookingDataComplete
		? {
				activeBookingDates: bookingActivityIndex.activeDates,
				activeVehicleKeys: bookingActivityIndex.activeVehicles,
			}
		: {};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				hideClose={true}
				className="bg-[#0f0f11] text-gray-300 border-white/5 p-0 gap-0 overflow-hidden flex h-[90vh] rounded-[2rem] shadow-2xl font-sans w-fit max-w-[95vw]"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Booking Inquiry</DialogTitle>
				</DialogHeader>

				<div className="flex-1 flex min-w-0">
					{/* Column 1: Calendar */}
					<div className="w-[450px] p-10 flex flex-col bg-[#050505] border-r border-white/5 overflow-y-auto custom-scrollbar">
						{isLoadingBookings ? (
							<div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
								<Loader2 className="h-6 w-6 animate-spin" />
								<span className="text-xs uppercase tracking-widest">
									Loading bookings
								</span>
							</div>
						) : hasBookingLoadError ? (
							<div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
								<AlertTriangle className="h-6 w-6 text-amber-500" />
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-widest text-amber-500">
										Incomplete data
									</div>
									<p className="text-xs text-gray-500 leading-relaxed">
										Booking data could not be loaded, so what is shown here may
										be incomplete. Nothing is marked as archived.
									</p>
								</div>
								<button
									type="button"
									onClick={retryBookingLoad}
									className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
								>
									Retry
								</button>
							</div>
						) : (
							<BookingCalendarGrid
								currentMonth={currentMonth}
								selectedDate={selectedDate}
								onMonthChange={setCurrentMonth}
								onDateSelect={handleDateSelect}
								bookingsByDateMap={bookingsByDateMap}
								searchQuery={searchQuery}
								searchMatchDates={searchMatchDates}
								activeCustomerDateSet={new Set(activeCustomerHistoryDates)}
								activeBookingDates={
									classification.activeBookingDates ?? new Set<string>()
								}
							/>
						)}
					</div>

					{/* Column 2: Customers booked on the selected day */}
					<div className="w-[320px] bg-[#0a0a0b] border-r border-white/5 flex flex-col">
						{isLoadingBookings || hasBookingLoadError ? (
							<div className="flex-1 p-6 text-xs text-gray-700 italic">
								{isLoadingBookings ? "Loading…" : "Unavailable"}
							</div>
						) : (
							<BookingSidebarCustomerList
								searchQuery={searchQuery}
								sidebarGroupedBookings={sidebarGroupedBookings}
								selectedBookingId={selectedBookingId}
								setSelectedBookingId={setSelectedBookingId}
								activeVehicleKeys={
									classification.activeVehicleKeys ?? new Set<string>()
								}
							/>
						)}
					</div>

					{/* Column 3: Details of the selected customer */}
					<div className="flex-1 bg-[#0a0a0b] flex flex-col w-[360px] max-w-[360px]">
						<BookingSidebarHeader
							selectedRows={[]}
							preBookingStatus=""
							setPreBookingStatus={() => {}}
							bookingStatuses={[]}
							bookingNote=""
							setBookingNote={() => {}}
							onClose={() => onOpenChange(false)}
						/>

						<div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
							<BookingSidebarDetails
								activeBookingRep={activeBookingRep}
								selectedRows={[]}
								activeCustomerBookings={activeCustomerBookings}
								// No notes: the inquiry shows no notes at all, and passing none
								// suppresses the popover without touching the details component.
								consolidatedNotes={[]}
								activeCustomerHistoryDates={activeCustomerHistoryDates}
								onHistoryDateClick={(date) => {
									setCurrentMonth(date);
									handleDateSelect(date);
								}}
							/>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
