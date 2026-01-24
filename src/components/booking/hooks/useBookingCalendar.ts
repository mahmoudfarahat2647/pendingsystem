import { format, isAfter, subYears } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

interface UseBookingCalendarOptions {
	open: boolean;
	initialSearchTerm: string;
}

export function useBookingCalendar({
	open,
	initialSearchTerm,
}: UseBookingCalendarOptions) {
	const bookingRowData = useAppStore((state) => state.bookingRowData);
	const archiveRowData = useAppStore((state) => state.archiveRowData);
	const updateBookingStatus = useAppStore((state) => state.updateBookingStatus);

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [bookingNote, setBookingNote] = useState("");
	const [preBookingStatus, setPreBookingStatus] = useState("");
	const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
		null,
	);

	const isDateInPast = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return selectedDate < today;
	}, [selectedDate]);

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

	return {
		currentMonth,
		setCurrentMonth,
		selectedDate,
		setSelectedDate,
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
		isDateInPast,
	};
}
