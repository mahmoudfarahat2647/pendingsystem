"use client";

import type { BookingStatus, PendingRow } from "@/types";
import { BookingSidebarCustomerList } from "./BookingSidebarCustomerList";
import { BookingSidebarDetails } from "./BookingSidebarDetails";
import { BookingSidebarFooter } from "./BookingSidebarFooter";
import { BookingSidebarHeader } from "./BookingSidebarHeader";

interface BookingSidebarProps {
	selectedRows: PendingRow[];
	searchQuery: string;
	sidebarGroupedBookings: PendingRow[];
	selectedBookingId: string | null;
	setSelectedBookingId: (id: string | null) => void;
	activeBookingRep?: PendingRow;
	activeCustomerBookings: PendingRow[];
	consolidatedNotes: string[];
	bookingStatuses: BookingStatus[];
	updateBookingStatus: (id: string, status: string) => void;
	preBookingStatus: string;
	setPreBookingStatus: (status: string) => void;
	bookingNote: string;
	setBookingNote: (note: string) => void;
	activeCustomerHistoryDates: string[];
	onHistoryDateClick: (date: Date) => void;
	onConfirm: (date: string, note: string, status?: string) => void;
	onOpenChange: (open: boolean) => void;
	selectedDate: Date;
	isDateInPast?: boolean;
}

export const BookingSidebar = ({
	selectedRows,
	searchQuery,
	sidebarGroupedBookings,
	selectedBookingId,
	setSelectedBookingId,
	activeBookingRep,
	activeCustomerBookings,
	consolidatedNotes,
	bookingStatuses,
	updateBookingStatus,
	preBookingStatus,
	setPreBookingStatus,
	bookingNote,
	setBookingNote,
	activeCustomerHistoryDates,
	onHistoryDateClick,
	onConfirm,
	onOpenChange,
	selectedDate,
	isDateInPast,
}: BookingSidebarProps) => {
	return (
		<div className="w-[400px] bg-[#0a0a0b] border-l border-white/5 flex flex-col relative">
			<BookingSidebarHeader
				selectedRows={selectedRows}
				preBookingStatus={preBookingStatus}
				setPreBookingStatus={setPreBookingStatus}
				bookingStatuses={bookingStatuses}
				bookingNote={bookingNote}
				setBookingNote={setBookingNote}
				onClose={() => onOpenChange(false)}
			/>

			<BookingSidebarCustomerList
				searchQuery={searchQuery}
				sidebarGroupedBookings={sidebarGroupedBookings}
				selectedBookingId={selectedBookingId}
				setSelectedBookingId={setSelectedBookingId}
			/>

			<BookingSidebarDetails
				activeBookingRep={activeBookingRep}
				selectedRows={selectedRows}
				activeCustomerBookings={activeCustomerBookings}
				consolidatedNotes={consolidatedNotes}
				bookingStatuses={bookingStatuses}
				updateBookingStatus={updateBookingStatus}
				activeCustomerHistoryDates={activeCustomerHistoryDates}
				onHistoryDateClick={onHistoryDateClick}
			/>


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
	);
};
