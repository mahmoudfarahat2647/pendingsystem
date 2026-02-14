"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { BookingCalendarGrid } from "../booking/BookingCalendarGrid";
import { BookingSidebarCustomerList } from "../booking/BookingSidebarCustomerList";
import { BookingSidebarDetails } from "../booking/BookingSidebarDetails";
import { BookingSidebarFooter } from "../booking/BookingSidebarFooter";
import { BookingSidebarHeader } from "../booking/BookingSidebarHeader";
import { BookingTasks } from "../booking/BookingTasks";
import { useBookingCalendar } from "../booking/hooks/useBookingCalendar";

interface BookingCalendarModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (date: string, note: string, status?: string) => void;
	selectedRows: PendingRow[];
	initialSearchTerm?: string;
	bookingOnly?: boolean;
	/** Booking data from React Query - if not provided, falls back to Zustand store */
	bookingData?: PendingRow[];
	/** Archive data from React Query - if not provided, falls back to Zustand store */
	archiveData?: PendingRow[];
}

export const BookingCalendarModal = ({
	open,
	onOpenChange,
	onConfirm,
	selectedRows,
	initialSearchTerm = "",
	bookingOnly = false,
	bookingData,
	archiveData,
}: BookingCalendarModalProps) => {
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);
	const {
		currentMonth,
		setCurrentMonth,
		selectedDate,
		bookingNote,
		setBookingNote,
		preBookingStatus,
		setPreBookingStatus,
		searchQuery,
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
		isDateInPast,
	} = useBookingCalendar({ open, initialSearchTerm, bookingData, archiveData });

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				hideClose={true}
				className={cn(
					"bg-[#0f0f11] text-gray-300 border-white/5 p-0 gap-0 overflow-hidden flex h-[90vh] rounded-[2rem] shadow-2xl font-sans w-fit max-w-[95vw]",
					bookingOnly ? "max-w-3xl" : "",
				)}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Booking Schedule</DialogTitle>
				</DialogHeader>

				<div className="flex-1 flex min-w-0">
					{/* Column 1: Calendar & Tasks */}
					<div className="w-[450px] p-10 flex flex-col bg-[#050505] border-r border-white/5 overflow-y-auto custom-scrollbar">
						<BookingCalendarGrid
							currentMonth={currentMonth}
							selectedDate={selectedDate}
							onMonthChange={setCurrentMonth}
							onDateSelect={handleDateSelect}
							bookingsByDateMap={bookingsByDateMap}
							searchQuery={searchQuery}
							searchMatchDates={searchMatchDates}
							activeCustomerDateSet={new Set(activeCustomerHistoryDates)}
						/>

						<BookingTasks />
					</div>

					{!bookingOnly && (
						<>
							{/* Column 2: Scheduled Customers & History (Middle - Narrower) */}
							<div className="w-[320px] bg-[#0a0a0b] border-r border-white/5 flex flex-col">
								<BookingSidebarCustomerList
									searchQuery={searchQuery}
									sidebarGroupedBookings={sidebarGroupedBookings}
									selectedBookingId={selectedBookingId}
									setSelectedBookingId={setSelectedBookingId}
								/>
							</div>

							{/* Column 3: Customer Details & Actions (Right - Wider) */}
							<div className="flex-1 bg-[#0a0a0b] flex flex-col w-[360px] max-w-[360px]">
								<BookingSidebarHeader
									selectedRows={selectedRows}
									preBookingStatus={preBookingStatus}
									setPreBookingStatus={setPreBookingStatus}
									bookingStatuses={bookingStatuses}
									bookingNote={bookingNote}
									setBookingNote={setBookingNote}
									onClose={() => onOpenChange(false)}
								/>

								<div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
									<BookingSidebarDetails
										activeBookingRep={activeBookingRep}
										selectedRows={selectedRows}
										activeCustomerBookings={activeCustomerBookings}
										consolidatedNotes={consolidatedNotes}
										updateBookingStatus={() => {}}
										activeCustomerHistoryDates={activeCustomerHistoryDates}
										onHistoryDateClick={(date) => {
											setCurrentMonth(date);
											handleDateSelect(date);
										}}
									/>
								</div>

								<BookingSidebarFooter
									selectedRowsLength={selectedRows.length}
									searchQuery={searchQuery}
									selectedDate={selectedDate}
									bookingNote={bookingNote}
									preBookingStatus={preBookingStatus}
									onConfirm={onConfirm}
									onNoteReset={() => setBookingNote("")}
									onStatusReset={() => setPreBookingStatus("")}
									isDateInPast={isDateInPast}
								/>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
