import { format, isAfter, subYears } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import type { PendingRow } from "@/types";

interface UseBookingCalendarOptions {
	open: boolean;
	initialSearchTerm: string;
}

/**
 * Safely parses a "yyyy-MM-dd" string into a local Data object at midnight local time,
 * avoiding the JS default behavior of parsing it as UTC midnight.
 */
function parseLocalDate(dateStr: string | undefined): Date {
	if (!dateStr || typeof dateStr !== "string") return new Date(NaN);
	const [year, month, day] = dateStr.split("-").map(Number);
	if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
		return new Date(NaN);
	return new Date(year, month - 1, day);
}

export function useBookingCalendar({
	open,
	initialSearchTerm,
}: UseBookingCalendarOptions) {
	// Directly fetch the required data inside the hook to prevent prop-drilling
	const { data: bookingRowData = [] } = useOrdersQuery("booking");
	const { data: archiveRowData = [] } = useOrdersQuery("archive");

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

	const prevVinRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (open) {
			setSearchQuery(initialSearchTerm);
			setBookingNote("");
			setPreBookingStatus("");
			setSelectedBookingId(null);
			setSelectedDate(new Date());
			setCurrentMonth(new Date());
			prevVinRef.current = undefined;
		}
	}, [open, initialSearchTerm]);

	const allBookings = useMemo(
		() => [...bookingRowData, ...archiveRowData],
		[bookingRowData, archiveRowData],
	);

	const filteredBookings = useMemo(() => {
		return allBookings.filter((b) => {
			if (!isAfter(parseLocalDate(b.bookingDate), twoYearsAgo)) return false;
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

	// Group bookings by date, but only keep one representative row per unique VIN (customer)
	// This ensures the calendar shows customer count, not parts count
	const bookingsByDateMap = useMemo(() => {
		const map: Record<string, PendingRow[]> = {};
		allBookings.forEach((b) => {
			if (
				b.bookingDate &&
				isAfter(parseLocalDate(b.bookingDate), twoYearsAgo)
			) {
				if (!map[b.bookingDate]) map[b.bookingDate] = [];
				// Only add if this VIN is not already in the list for this date
				const vinExists = map[b.bookingDate].some(
					(existing) => existing.vin === b.vin,
				);
				if (!vinExists) {
					map[b.bookingDate].push(b);
				}
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
		).sort((a, b) => parseLocalDate(b).getTime() - parseLocalDate(a).getTime());
	}, [allBookings, activeBookingRep]);

	useEffect(() => {
		const currentVin = activeBookingRep?.vin;
		// Guard: Only jump the calendar when a genuinely new VIN is selected.
		// We only update prevVinRef when currentVin is defined, so transient undefined gaps
		// (caused by a refetch or list-rebuild clearing activeBookingRep for one render)
		// are ignored — the ref retains the last known VIN, and the guard fires only on a real change.
		if (
			currentVin &&
			currentVin !== prevVinRef.current &&
			activeCustomerHistoryDates.length > 0
		) {
			const firstDate = parseLocalDate(activeCustomerHistoryDates[0]);
			setCurrentMonth(firstDate);
			setSelectedDate(firstDate);
		}
		// Only persist to ref when we have a real VIN; ignore transient undefined.
		if (currentVin) {
			prevVinRef.current = currentVin;
		}
	}, [activeCustomerHistoryDates, activeBookingRep?.vin]);

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
