"use client";

import { format } from "date-fns";
import {
	Car,
	ChevronRight,
	History as HistoryIcon,
	MessageSquare,
	Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BookingStatus, PendingRow } from "@/types";

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
}: BookingSidebarProps) => {
	return (
		<div className="w-[400px] bg-[#0a0a0b] border-l border-white/5 flex flex-col">
			{selectedRows.length > 0 && (
				<div className="p-6 border-b border-indigo-500/10 bg-indigo-500/[0.02] space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
								New Booking
							</div>
							<h3 className="text-xs font-medium text-gray-400">
								{selectedRows.length} Items • {selectedRows[0]?.customerName}
							</h3>
						</div>
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all group"
								>
									{preBookingStatus ? (
										<>
											<div
												className={cn(
													"w-2 h-2 rounded-full",
													bookingStatuses.find(
														(s) => s.label === preBookingStatus,
													)?.color || "bg-gray-500",
												)}
											/>
											<span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
												{preBookingStatus}
											</span>
										</>
									) : (
										<span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/70">
											Set Status
										</span>
									)}
									<ChevronRight className="h-3 w-3 text-indigo-500 group-hover:text-indigo-400 rotate-90" />
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2 bg-[#0f0f11] border-white/10 rounded-xl shadow-2xl z-[60]">
								<div className="space-y-1">
									{bookingStatuses.map((status) => (
										<button
											key={status.id}
											onClick={() => setPreBookingStatus(status.label)}
											className={cn(
												"w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
												preBookingStatus === status.label
													? "bg-white/10 text-white"
													: "text-gray-400 hover:bg-white/5 hover:text-gray-200",
											)}
										>
											<div
												className={cn(
													"w-2 h-2 rounded-full shadow-lg",
													status.color,
												)}
											/>
											<span className="text-xs font-semibold">
												{status.label}
											</span>
										</button>
									))}
								</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="relative">
						<MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500/50 pointer-events-none" />
						<Input
							value={bookingNote}
							onChange={(e) => setBookingNote(e.target.value)}
							placeholder="Add initial note..."
							className="w-full pl-10 pr-3 h-9 bg-white/[0.02] border-indigo-500/20 rounded-lg focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 text-sm text-gray-300 placeholder:text-gray-600 transition-all"
						/>
					</div>
				</div>
			)}

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

			<div className="flex-1 p-8 overflow-y-auto">
				{activeBookingRep ? (
					<div className="space-y-6">
						<div className="space-y-1">
							<div className="text-[10px] uppercase tracking-widest text-renault-yellow font-bold">
								Details
							</div>
							<div className="flex items-center gap-2">
								<h2 className="text-xl font-light text-white">
									{activeBookingRep.customerName}
								</h2>
								{consolidatedNotes.length > 0 && (
									<Popover>
										<PopoverTrigger asChild>
											<button className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-renault-yellow transition-colors">
												<MessageSquare className="h-4 w-4" />
											</button>
										</PopoverTrigger>
										<PopoverContent className="bg-[#0f0f11] border-white/10 text-gray-300 w-80 p-4 shadow-xl rounded-xl">
											<div className="space-y-3">
												<div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
													Booking Notes
												</div>
												<div className="space-y-2">
													{consolidatedNotes.map((note) => (
														<div
															key={note}
															className="text-sm italic text-gray-400 bg-white/[0.02] p-2 rounded border border-white/5"
														>
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
									<span className="block text-xs font-medium text-gray-500 uppercase">
										VIN & Model
									</span>
									<span className="font-mono text-gray-300">
										{activeBookingRep.vin}
										<span className="text-renault-yellow ml-2 text-xs font-sans uppercase tracking-wider">
											[{activeBookingRep.model || "No Model"}]
										</span>
									</span>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<Package className="h-4 w-4 mt-0.5 text-gray-600" />
								<div className="space-y-3 flex-1">
									<div className="flex items-center justify-between">
										<span className="block text-xs font-medium text-gray-500 uppercase">
											Parts List
										</span>
										<Popover>
											<PopoverTrigger asChild>
												<button
													type="button"
													className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
												>
													{activeBookingRep.bookingStatus ? (
														<>
															<div
																className={cn(
																	"w-2 h-2 rounded-full",
																	bookingStatuses.find(
																		(s) =>
																			s.label ===
																			activeBookingRep.bookingStatus,
																	)?.color || "bg-gray-500",
																)}
															/>
															<span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
																{activeBookingRep.bookingStatus}
															</span>
														</>
													) : (
														<span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
															Status
														</span>
													)}
													<ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-gray-400 transition-transform rotate-90" />
												</button>
											</PopoverTrigger>
											<PopoverContent className="w-48 p-2 bg-[#0f0f11] border-white/10 rounded-xl shadow-2xl z-[60]">
												<div className="space-y-1">
													{bookingStatuses.map((status) => (
														<button
															key={status.id}
															onClick={() =>
																activeCustomerBookings.forEach((b) =>
																	updateBookingStatus(b.id, status.label),
																)
															}
															className={cn(
																"w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
																activeBookingRep.bookingStatus === status.label
																	? "bg-white/10 text-white"
																	: "text-gray-400 hover:bg-white/5 hover:text-gray-200",
															)}
														>
															<div
																className={cn(
																	"w-2 h-2 rounded-full shadow-lg",
																	status.color,
																)}
															/>
															<span className="text-xs font-semibold">
																{status.label}
															</span>
														</button>
													))}
												</div>
											</PopoverContent>
										</Popover>
									</div>
									{activeCustomerBookings.map((booking, idx) => (
										<div
											key={booking.id}
											className={cn(
												"relative pl-4 border-l border-white/10",
												idx !== activeCustomerBookings.length - 1 && "pb-2",
											)}
										>
											<div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-white/10 border border-[#0a0a0b]" />
											<div className="text-gray-300 leading-relaxed font-medium">
												{booking.description ||
													booking.partNumber ||
													"No part info"}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="h-full flex items-center justify-center text-gray-800">
						<span className="text-xs uppercase tracking-widest">
							Select a customer
						</span>
					</div>
				)}
			</div>

			<div className="p-6 bg-[#0e0e10] border-t border-white/5 space-y-3">
				<div className="flex items-center gap-2 text-gray-500 mb-2">
					<HistoryIcon className="h-3 w-3" />
					<span className="text-[10px] uppercase tracking-widest font-bold">
						Booking History ({activeCustomerHistoryDates.length})
					</span>
				</div>
				<div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar content-start">
					{activeCustomerHistoryDates.length > 0 ? (
						activeCustomerHistoryDates.map((date) => (
							<button
								type="button"
								key={date}
								onClick={() => onHistoryDateClick(new Date(date))}
								className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
							>
								{format(new Date(date), "MMM d, yyyy")}
							</button>
						))
					) : (
						<span className="text-xs text-gray-700 italic pl-1">
							No previous bookings
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
