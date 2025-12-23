"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar as CalendarIcon,
    User,
    Car,
    History as HistoryIcon,
    Package,
    MessageSquare,
    X,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    isAfter,
    subYears,
    parse,
    isValid,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

interface BookingCalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (date: string, note: string) => void;
    selectedRows: PendingRow[];
    initialSearchTerm?: string;
}

export const BookingCalendarModal = ({
    open,
    onOpenChange,
    onConfirm,
    selectedRows,
    initialSearchTerm = "",
}: BookingCalendarModalProps) => {
    const { bookingRowData } = useAppStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookingNote, setBookingNote] = useState("");
    const [searchQuery, setSearchQuery] = useState(initialSearchTerm);

    // Track which sidebar item is selected for details view
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

    const twoYearsAgo = useMemo(() => subYears(new Date(), 2), []);

    // Reset or update search query when modal opens or initial term changes
    useEffect(() => {
        if (open) {
            setSearchQuery(initialSearchTerm);
            setBookingNote("");
            setSelectedBookingId(null);
        }
    }, [open, initialSearchTerm]);

    // Filter bookings for the past 2 years and by search query
    const filteredBookings = useMemo(() => {
        return bookingRowData.filter((b) => {
            const bDate = new Date(b.bookingDate || "");
            const isInRange = isAfter(bDate, twoYearsAgo);
            if (!isInRange) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    b.customerName?.toLowerCase().includes(query) ||
                    b.vin?.toLowerCase().includes(query) ||
                    b.partNumber?.toLowerCase().includes(query) ||
                    b.bookingDate?.includes(query)
                );
            }
            return true;
        });
    }, [bookingRowData, twoYearsAgo, searchQuery]);

    const searchMatchDates = useMemo(() => {
        if (!searchQuery) return new Set<string>();
        return new Set(filteredBookings.map(b => b.bookingDate).filter(Boolean) as string[]);
    }, [filteredBookings, searchQuery]);

    const bookingsByDateMap = useMemo(() => {
        const map: Record<string, PendingRow[]> = {};
        bookingRowData.forEach((b) => {
            if (b.bookingDate && isAfter(new Date(b.bookingDate), twoYearsAgo)) {
                if (!map[b.bookingDate]) map[b.bookingDate] = [];
                map[b.bookingDate].push(b);
            }
        });
        return map;
    }, [bookingRowData, twoYearsAgo]);

    // Automatically select the first booking in the list when list updates, if none selected
    const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

    // Group filtered bookings by VIN for sidebar display
    const sidebarGroupedBookings = useMemo(() => {
        const list = searchQuery ? filteredBookings : (bookingsByDateMap[selectedDateKey] || []);

        // Group by VIN
        const groups: Record<string, PendingRow[]> = {};
        list.forEach(b => {
            const key = b.vin || "unknown"; // Fallback if no VIN, though unlikely for valid bookings
            if (!groups[key]) groups[key] = [];
            groups[key].push(b);
        });

        // Return one representative per VIN (usually the first one found) to show in the list
        return Object.values(groups).map(g => g[0]);
    }, [filteredBookings, searchQuery, selectedDateKey, bookingsByDateMap]);

    useEffect(() => {
        if (sidebarGroupedBookings.length > 0 && !selectedBookingId) {
            setSelectedBookingId(sidebarGroupedBookings[0].id);
        } else if (sidebarGroupedBookings.length > 0 && !sidebarGroupedBookings.find(b => b.id === selectedBookingId)) {
            setSelectedBookingId(sidebarGroupedBookings[0].id);
        } else if (sidebarGroupedBookings.length === 0) {
            setSelectedBookingId(null);
        }
    }, [sidebarGroupedBookings, selectedBookingId]);

    // Get ALL bookings for the active selection (same VIN)
    const activeCustomerBookings = useMemo(() => {
        const selectedRep = bookingRowData.find(b => b.id === selectedBookingId);
        if (!selectedRep || !selectedRep.vin) return [];

        // Find all bookings with same VIN on the SAME day if not searching, or just same VIN if searching (context dependent, but requirements say "this customer and this date")
        // Requirement 2: "all parts belonging to this customer and this date"

        // If we are in search mode, we might want to show that specific date's details. 
        // But the representative 'selectedRep' has a specific date. Let's filter by VIN and that representative's Date.

        return bookingRowData.filter(b =>
            b.vin === selectedRep.vin &&
            b.bookingDate === selectedRep.bookingDate
        );
    }, [bookingRowData, selectedBookingId]);

    const activeBookingRep = activeCustomerBookings[0];

    // Consolidated notes for the active customer and date
    const consolidatedNotes = useMemo(() => {
        const notes = activeCustomerBookings
            .map(b => b.bookingNote?.trim())
            .filter(Boolean) as string[];
        return Array.from(new Set(notes)); // Deduplicate notes
    }, [activeCustomerBookings]);

    // Get specific history dates for the active booking's customer
    const activeCustomerHistoryDates = useMemo(() => {
        if (!activeBookingRep?.vin) return [];
        const uniqueDates = new Set(
            bookingRowData
                .filter(b => b.vin === activeBookingRep.vin && b.bookingDate)
                .map(b => b.bookingDate as string)
        );
        return Array.from(uniqueDates)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Newest first
    }, [bookingRowData, activeBookingRep]);

    // Set of dates for the active customer (for highlighting on calendar)
    const activeCustomerDateSet = useMemo(() => {
        return new Set(activeCustomerHistoryDates);
    }, [activeCustomerHistoryDates]);

    // Auto-navigate to first booking date when customer is selected
    useEffect(() => {
        if (activeCustomerHistoryDates.length > 0) {
            const firstDate = new Date(activeCustomerHistoryDates[0]);
            setCurrentMonth(firstDate);
            setSelectedDate(firstDate);
        }
    }, [selectedBookingId]); // Only trigger when booking selection changes


    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-light text-white tracking-widest uppercase">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
        return (
            <div className="grid grid-cols-7 mb-6">
                {days.map((day) => (
                    <div
                        key={day}
                        className="text-center text-[10px] font-medium text-gray-600 uppercase tracking-[0.2em]"
                    >
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return (
            <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const hasBookings = !!bookingsByDateMap[dateKey];
                    const isSearchMatch = searchQuery && searchMatchDates.has(dateKey);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isFaded = searchQuery && !isSearchMatch;
                    const isActiveCustomerDate = activeCustomerDateSet.has(dateKey);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                                "relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 group",
                                !isCurrentMonth ? "text-gray-800" : "text-gray-400 hover:text-white",
                                // Selection Style: Minimalist Outline or Subtle Fill
                                isSelected
                                    ? (searchQuery
                                        ? "ring-2 ring-emerald-500 text-emerald-400 bg-emerald-500/10"
                                        : "ring-1 ring-white/50 text-white bg-white/10")
                                    : "hover:bg-white/5",
                                isSearchMatch && !isSelected && "text-emerald-500 font-bold",
                                isFaded && !isSelected && "opacity-20 pointer-events-none",
                                // Highlight active customer dates with subtle yellow ring
                                isActiveCustomerDate && !isSelected && !isFaded && "ring-1 ring-renault-yellow/40 text-renault-yellow"
                            )}
                        >
                            {format(day, "d")}

                            {/* Minimalism: Small dots only */}
                            {hasBookings && !isSelected && !isFaded && (
                                <div className={cn(
                                    "absolute bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full",
                                    isActiveCustomerDate ? "bg-renault-yellow w-1 h-1" : (isSearchMatch ? "bg-emerald-500 w-1 h-1" : (isCurrentMonth ? "bg-renault-yellow" : "bg-gray-800"))
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    const handleConfirmBooking = () => {
        onConfirm(selectedDateKey, bookingNote);
        setBookingNote("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose={true} className="bg-[#0f0f11] text-gray-300 border-white/5 max-w-6xl p-0 gap-0 overflow-hidden flex h-[85vh] rounded-[2rem] shadow-2xl font-sans">
                <DialogHeader className="sr-only">
                    <DialogTitle>Booking Schedule</DialogTitle>
                </DialogHeader>

                <DialogClose className="absolute right-6 top-6 z-50 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none ring-offset-0 focus:ring-0">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                {/* Left Side: Calendar (Reservers) */}
                <div className="flex-1 p-10 flex flex-col bg-[#050505]">
                    {/* Minimalist Top Bar */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">Reservers</h3>
                        </div>

                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, VIN, or part..."
                                className="pl-10 h-10 bg-white/[0.03] border-white/10 rounded-full focus:ring-1 focus:ring-white/20 focus:border-white/20 placeholder:text-gray-600 text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}
                    </div>

                    {/* Booking Action Area */}
                    <div className="mt-12 flex items-center gap-6">
                        <div className="flex-1 relative">
                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
                            <Input
                                value={bookingNote}
                                onChange={(e) => setBookingNote(e.target.value)}
                                placeholder={selectedRows.length === 0 ? "View Mode: History" : "Add a note for this booking..."}
                                disabled={selectedRows.length === 0}
                                className="w-full pl-11 bg-white/[0.03] border-white/10 rounded-full focus:ring-1 focus:ring-white/20 focus:border-white/20 h-12 text-gray-300 placeholder:text-gray-700 disabled:opacity-30 transition-all"
                            />
                        </div>
                        <Button
                            onClick={handleConfirmBooking}
                            disabled={!!searchQuery || selectedRows.length === 0}
                            className={cn(
                                "h-12 px-10 rounded-full font-bold transition-all text-xs tracking-[0.1em] uppercase border shadow-lg",
                                (searchQuery || selectedRows.length === 0)
                                    ? "bg-transparent border-white/5 text-gray-700 cursor-not-allowed"
                                    : "bg-white text-black border-white hover:bg-gray-100 active:scale-95 translate-y-0 hover:-translate-y-0.5"
                            )}
                        >
                            {selectedRows.length === 0 ? "View Mode" : (searchQuery ? "Clear Search" : "Book Date")}
                        </Button>
                    </div>
                </div>

                {/* Right Side: Sidebar (Detail Card) */}
                <div className="w-[400px] bg-[#0a0a0b] border-l border-white/5 flex flex-col">

                    {/* Section 1: Customer List */}
                    <div className="h-1/3 border-b border-white/5 p-6 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 sticky top-0 bg-[#0a0a0b] py-2 z-10">
                            {searchQuery ? "Search Results" : "Customers"}
                        </h4>
                        <div className="space-y-2">
                            {sidebarGroupedBookings.length === 0 ? (
                                <p className="text-xs text-gray-700 italic">No bookings found.</p>
                            ) : (
                                sidebarGroupedBookings.map((booking) => (
                                    <button
                                        key={booking.id}
                                        onClick={() => setSelectedBookingId(booking.id)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg border transition-all duration-200 group flex items-center justify-between",
                                            selectedBookingId === booking.id
                                                ? "bg-white/5 border-white/10 text-white"
                                                : "border-transparent hover:bg-white/[0.02] text-gray-500"
                                        )}
                                    >
                                        <span className="text-sm font-medium truncate">{booking.customerName}</span>
                                        {searchQuery && booking.bookingDate && (
                                            <span className="text-[9px] font-mono text-gray-600">{format(new Date(booking.bookingDate), "MMM d")}</span>
                                        )}
                                        {!searchQuery && (
                                            <ChevronRight className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity", selectedBookingId === booking.id && "opacity-100")} />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Section 2: Details Area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {activeBookingRep ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-widest text-renault-yellow font-bold">Details</div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-light text-white">{activeBookingRep.customerName}</h2>

                                        {consolidatedNotes.length > 0 && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-renault-yellow transition-colors">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="bg-[#0f0f11] border-white/10 text-gray-300 w-80 p-4 shadow-xl rounded-xl">
                                                    <div className="space-y-3">
                                                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Booking Notes</div>
                                                        <div className="space-y-2">
                                                            {consolidatedNotes.map((note, idx) => (
                                                                <div key={idx} className="text-sm italic text-gray-400 bg-white/[0.02] p-2 rounded border border-white/5">
                                                                    "{note}"
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm text-gray-400">
                                    <div className="flex items-start gap-3">
                                        <Car className="h-4 w-4 mt-0.5 text-gray-600" />
                                        <div>
                                            <span className="block text-xs font-medium text-gray-500 uppercase">VIN & Model</span>
                                            <span className="font-mono text-gray-300">
                                                {activeBookingRep.vin}
                                                <span className="text-renault-yellow ml-2 text-xs font-sans uppercase tracking-wider">
                                                    [{activeBookingRep.model || "No Model"}]
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Consolidated Parts List */}
                                    <div className="flex items-start gap-3">
                                        <Package className="h-4 w-4 mt-0.5 text-gray-600" />
                                        <div className="space-y-3 flex-1">
                                            <span className="block text-xs font-medium text-gray-500 uppercase">Parts List</span>

                                            {activeCustomerBookings.map((booking, idx) => (
                                                <div key={booking.id} className={cn("relative pl-4 border-l border-white/10", idx !== activeCustomerBookings.length - 1 && "pb-2")}>
                                                    {/* Minimalist dot */}
                                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-white/10 border border-[#0a0a0b]" />

                                                    <div className="text-gray-300 leading-relaxed font-medium">
                                                        {booking.description || booking.partNumber || "No part info"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-800">
                                <span className="text-xs uppercase tracking-widest">Select a customer</span>
                            </div>
                        )}
                    </div>

                    {/* Section 3: History Footer */}
                    <div className="p-6 bg-[#0e0e10] border-t border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <HistoryIcon className="h-3 w-3" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Booking History ({activeCustomerHistoryDates.length})</span>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar content-start">
                            {activeCustomerHistoryDates.length > 0 ? (
                                activeCustomerHistoryDates.map((date, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const targetDate = new Date(date);
                                            setCurrentMonth(targetDate);
                                            setSelectedDate(targetDate);
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        {format(new Date(date), "MMM d, yyyy")}
                                    </button>
                                ))
                            ) : (
                                <span className="text-xs text-gray-700 italic pl-1">No previous bookings</span>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
