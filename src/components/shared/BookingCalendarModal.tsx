"use client";

import { format, isAfter, subYears } from "date-fns";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { BookingCalendarGrid } from "../booking/BookingCalendarGrid";
import { BookingSidebar } from "../booking/BookingSidebar";

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
	const bookingRowData = useAppStore((state) => state.bookingRowData);
	const archiveRowData = useAppStore((state) => state.archiveRowData);
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);
	const updateBookingStatus = useAppStore((state) => state.updateBookingStatus);

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [bookingNote, setBookingNote] = useState("");
	const [preBookingStatus, setPreBookingStatus] = useState("");
	const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
		null,
	);

	const twoYearsAgo = useMemo(() => subYears(new Date(), 2), []);

	useEffect(() => {
		if (open) {
			setSearchQuery(initialSearchTerm);
			setBookingNote("");
			setPreBookingStatus("");
			setSelectedBookingId(null);
		}
	}, [open, initialSearchTerm]);

	const allBookings = useMemo(
		() => [...bookingRowData, ...archiveRowData],
		[bookingRowData, archiveRowData],
	);

	const filteredBookings = useMemo(() => {
		return allBookings.filter((b) => {
			if (!isAfter(new Date(b.bookingDate || ""), twoYearsAgo)) return false;
			if (!searchQuery) return true;
			const query = searchQuery.toLowerCase();
			return (
				b.customerName?.toLowerCase().includes(query) ||
				b.vin?.toLowerCase().includes(query) ||
				b.partNumber?.toLowerCase().includes(query) ||
				b.bookingDate?.includes(query)
			);
		});
	}, [allBookings, twoYearsAgo, searchQuery]);

	const searchMatchDates = useMemo(
		() =>
			new Set(
				filteredBookings.map((b) => b.bookingDate).filter(Boolean) as string[],
			),
		[filteredBookings],
	);

	const bookingsByDateMap = useMemo(() => {
		const map: Record<string, PendingRow[]> = {};
		allBookings.forEach((b) => {
			if (b.bookingDate && isAfter(new Date(b.bookingDate), twoYearsAgo)) {
				if (!map[b.bookingDate]) map[b.bookingDate] = [];
				map[b.bookingDate].push(b);
			}
		});
		return map;
	}, [allBookings, twoYearsAgo]);

	const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

	const sidebarGroupedBookings = useMemo(() => {
		const list = searchQuery
			? filteredBookings
			: bookingsByDateMap[selectedDateKey] || [];
		const groups: Record<string, PendingRow[]> = {};
		list.forEach((b) => {
			const key = b.vin || "unknown";
			if (!groups[key]) groups[key] = [];
			groups[key].push(b);
		});
		return Object.values(groups).map((g) => g[0]);
	}, [filteredBookings, searchQuery, selectedDateKey, bookingsByDateMap]);

	useEffect(() => {
		if (
			sidebarGroupedBookings.length > 0 &&
			(!selectedBookingId ||
				!sidebarGroupedBookings.find((b) => b.id === selectedBookingId))
		) {
			setSelectedBookingId(sidebarGroupedBookings[0].id);
		} else if (sidebarGroupedBookings.length === 0) setSelectedBookingId(null);
	}, [sidebarGroupedBookings, selectedBookingId]);

	const activeCustomerBookings = useMemo(() => {
		const selectedRep = allBookings.find((b) => b.id === selectedBookingId);
		if (!selectedRep || !selectedRep.vin) return [];
		return allBookings.filter(
			(b) =>
				b.vin === selectedRep.vin && b.bookingDate === selectedRep.bookingDate,
		);
	}, [allBookings, selectedBookingId]);

	const activeBookingRep = activeCustomerBookings[0];
	const consolidatedNotes = useMemo(
		() =>
			Array.from(
				new Set(
					activeCustomerBookings
						.map((b) => b.bookingNote?.trim())
						.filter(Boolean) as string[],
				),
			),
		[activeCustomerBookings],
	);

	const activeCustomerHistoryDates = useMemo(() => {
		if (!activeBookingRep?.vin) return [];
		return Array.from(
			new Set(
				allBookings
					.filter((b) => b.vin === activeBookingRep.vin && b.bookingDate)
					.map((b) => b.bookingDate as string),
			),
		).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
	}, [allBookings, activeBookingRep]);

	useEffect(() => {
		if (activeCustomerHistoryDates.length > 0) {
			const firstDate = new Date(activeCustomerHistoryDates[0]);
			setCurrentMonth(firstDate);
			setSelectedDate(firstDate);
		}
	}, [activeCustomerHistoryDates]);

	const handleDateSelect = (day: Date) => {
		setSelectedDate(day);
	};

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
							setSelectedDate(date);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
