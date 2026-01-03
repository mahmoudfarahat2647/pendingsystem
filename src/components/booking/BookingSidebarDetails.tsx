import { Car, ChevronRight, MessageSquare, Package } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BookingStatus, PendingRow } from "@/types";

interface BookingSidebarDetailsProps {
	activeBookingRep?: PendingRow;
	selectedRows: PendingRow[];
	activeCustomerBookings: PendingRow[];
	consolidatedNotes: string[];
	bookingStatuses: BookingStatus[];
	updateBookingStatus: (id: string, status: string) => void;
}

export const BookingSidebarDetails = ({
	activeBookingRep,
	selectedRows,
	activeCustomerBookings,
	consolidatedNotes,
	bookingStatuses,
	updateBookingStatus,
}: BookingSidebarDetailsProps) => {
	if (!activeBookingRep && selectedRows.length === 0) {
		return (
			<div className="flex-1 p-8 overflow-y-auto">
				<div className="h-full flex items-center justify-center text-gray-800">
					<span className="text-xs uppercase tracking-widest">
						Select a customer
					</span>
				</div>
			</div>
		);
	}

	const _isNewBooking = !activeBookingRep;
	const currentRep = activeBookingRep || selectedRows[0];
	const currentParts = activeBookingRep ? activeCustomerBookings : selectedRows;

	return (
		<div className="flex-1 p-8 overflow-y-auto">
			<div className="space-y-6">
				<div className="space-y-1">
					<div
						className={cn(
							"text-[10px] uppercase tracking-widest font-bold",
							activeBookingRep ? "text-renault-yellow" : "text-indigo-400",
						)}
					>
						{activeBookingRep ? "Details" : "Preview New Booking"}
					</div>
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-light text-white">
							{currentRep?.customerName}
						</h2>
						{consolidatedNotes.length > 0 && activeBookingRep && (
							<Popover>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-renault-yellow transition-colors"
									>
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
								{currentRep?.vin}
								<span className="text-renault-yellow ml-2 text-xs font-sans uppercase tracking-wider">
									[{currentRep?.model || "No Model"}]
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
								{activeBookingRep && (
									<Popover>
										<PopoverTrigger asChild>
											<button
												type="button"
												className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
											>
												{activeBookingRep.bookingStatus ? (
													<>
														{(() => {
															const color =
																bookingStatuses.find(
																	(s) =>
																		s.label === activeBookingRep.bookingStatus,
																)?.color || "bg-gray-500";
															const isHex =
																color.startsWith("#") ||
																color.startsWith("rgb");
															return (
																<div
																	className={cn(
																		"w-2 h-2 rounded-full",
																		!isHex && color,
																	)}
																	style={{
																		backgroundColor: isHex ? color : undefined,
																	}}
																/>
															);
														})()}
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
														type="button"
														key={status.id}
														onClick={() => {
															activeCustomerBookings.forEach((b) => {
																updateBookingStatus(b.id, status.label);
															});
														}}
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
																!(
																	status.color.startsWith("#") ||
																	status.color.startsWith("rgb")
																) && status.color,
															)}
															style={{
																backgroundColor:
																	status.color.startsWith("#") ||
																	status.color.startsWith("rgb")
																		? status.color
																		: undefined,
															}}
														/>
														<span className="text-xs font-semibold">
															{status.label}
														</span>
													</button>
												))}
											</div>
										</PopoverContent>
									</Popover>
								)}
							</div>
							{currentParts.map((booking, idx) => (
								<div
									key={booking.id}
									className={cn(
										"relative pl-4 border-l border-white/10",
										idx !== currentParts.length - 1 && "pb-2",
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
		</div>
	);
};
