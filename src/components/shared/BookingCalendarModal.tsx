"use client";

import { Search } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";
import { BookingCalendarGrid } from "../booking/BookingCalendarGrid";
import { BookingSidebar } from "../booking/BookingSidebar";
import { useBookingCalendar } from "../booking/hooks/useBookingCalendar";

interface BookingCalendarModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (date: string, note: string, status?: string) => void;
	selectedRows: PendingRow[];
	initialSearchTerm?: string;
	bookingOnly?: boolean;
}

export const BookingCalendarModal = ({
	open,
	onOpenChange,
	onConfirm,
	selectedRows,
	initialSearchTerm = "",
	bookingOnly = false,
}: BookingCalendarModalProps) => {
	const {
		currentMonth,
		setCurrentMonth,
		selectedDate,
		bookingNote,
		setBookingNote,
		preBookingStatus,
		setPreBookingStatus,
		searchQuery,
		setSearchQuery,
		selectedBookingId,
		setSelectedBookingId,
		searchMatchDates,
		bookingsByDateMap,
		sidebarGroupedBookings,
		activeBookingRep,
		activeCustomerBookings,
		consolidatedNotes,
		activeCustomerHistoryDates,
		handleDateSelect,
		bookingStatuses,
		updateBookingStatus,
	} = useBookingCalendar({ open, initialSearchTerm });

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				hideClose={true}
				className={cn(
					"bg-[#0f0f11] text-gray-300 border-white/5 p-0 gap-0 overflow-hidden flex h-[85vh] rounded-[2rem] shadow-2xl font-sans",
					bookingOnly ? "max-w-3xl" : "max-w-6xl",
				)}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Booking Schedule</DialogTitle>
				</DialogHeader>

				<div className="flex-1 p-10 flex flex-col bg-[#050505]">
					<div className="flex items-center justify-between mb-12">
						<h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">
							Reservers
						</h3>
						<div className="relative w-80">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search..."
								className="pl-10 h-10 bg-white/[0.03] border-white/10 rounded-full focus:ring-1 focus:ring-white/20 focus:border-white/20 placeholder:text-gray-600 text-sm transition-all"
							/>
						</div>
					</div>

					<BookingCalendarGrid
						currentMonth={currentMonth}
						selectedDate={selectedDate}
						onMonthChange={setCurrentMonth}
						onDateSelect={handleDateSelect}
						bookingsByDateMap={bookingsByDateMap}
						searchQuery={searchQuery}
						searchMatchDates={searchMatchDates}
						activeCustomerDateSet={new Set(activeCustomerHistoryDates)}
						bookingStatuses={bookingStatuses}
						previewBookings={selectedRows}
						previewStatus={preBookingStatus}
					/>
				</div>

				{!bookingOnly && (
					<BookingSidebar
						selectedRows={selectedRows}
						searchQuery={searchQuery}
						sidebarGroupedBookings={sidebarGroupedBookings}
						selectedBookingId={selectedBookingId}
						setSelectedBookingId={setSelectedBookingId}
						activeBookingRep={activeBookingRep}
						activeCustomerBookings={activeCustomerBookings}
						consolidatedNotes={consolidatedNotes}
						bookingStatuses={bookingStatuses}
						updateBookingStatus={updateBookingStatus}
						preBookingStatus={preBookingStatus}
						setPreBookingStatus={setPreBookingStatus}
						bookingNote={bookingNote}
						setBookingNote={setBookingNote}
						activeCustomerHistoryDates={activeCustomerHistoryDates}
						selectedDate={selectedDate}
						onOpenChange={onOpenChange}
						onConfirm={onConfirm}
						onHistoryDateClick={(date) => {
							setCurrentMonth(date);
							handleDateSelect(date);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
