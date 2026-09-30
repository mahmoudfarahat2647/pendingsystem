import {
	Car,
	History as HistoryIcon,
	MessageSquare,
	Package,
} from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";
import { parseDateLocal, safeFormatDate } from "@/utils/safeFormatDate";

interface BookingSidebarDetailsProps {
	activeBookingRep?: PendingRow;
	selectedRows: PendingRow[];
	activeCustomerBookings: PendingRow[];
	consolidatedNotes: string[];
	activeCustomerHistoryDates: string[];
	onHistoryDateClick: (date: Date) => void;
}

export const BookingSidebarDetails = ({
	activeBookingRep,
	selectedRows,
	activeCustomerBookings,
	consolidatedNotes,
	activeCustomerHistoryDates,
	onHistoryDateClick,
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
							activeBookingRep
								? "text-renault-yellow"
								: "text-indigo-600 dark:text-indigo-400",
						)}
					>
						{activeBookingRep ? "Details" : "Preview New Booking"}
					</div>
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-light text-black dark:text-white">
							{currentRep?.customerName}
						</h2>
						{consolidatedNotes.length > 0 && activeBookingRep && (
							<Popover>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 hover:text-renault-yellow transition-colors"
									>
										<MessageSquare className="h-4 w-4" />
									</button>
								</PopoverTrigger>
								<PopoverContent className="bg-white dark:bg-[#1c1c1e] border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 w-80 p-4 shadow-xl rounded-xl">
									<div className="space-y-3">
										<div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
											Booking Notes
										</div>
										<div className="space-y-2">
											{consolidatedNotes.map((note) => (
												<div
													key={note}
													className="text-sm italic text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.02] p-2 rounded border border-black/10 dark:border-white/5"
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

				<div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
					<div className="flex items-start gap-3">
						<Car className="h-4 w-4 mt-0.5 text-gray-500 dark:text-gray-600" />
						<div>
							<span className="block text-xs font-medium text-gray-500 uppercase">
								VIN & Model
							</span>
							<span className="font-mono text-gray-700 dark:text-gray-300">
								{currentRep?.vin}
								<span className="text-renault-yellow ml-2 text-xs font-sans uppercase tracking-wider">
									[{currentRep?.model || "No Model"}]
								</span>
							</span>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<Package className="h-4 w-4 mt-0.5 text-gray-500 dark:text-gray-600" />
						<div className="space-y-3 flex-1">
							<div className="flex items-center justify-between">
								<span className="block text-xs font-medium text-gray-500 uppercase">
									Parts List
								</span>
							</div>
							{currentParts.map((booking, idx) => (
								<div
									key={booking.id}
									className={cn(
										"relative pl-4 border-l border-black/10 dark:border-white/10",
										idx !== currentParts.length - 1 && "pb-2",
									)}
								>
									<div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-black/10 dark:bg-white/10 border border-[#1c1c1e]" />
									<div className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
										{booking.description ||
											booking.partNumber ||
											"No part info"}
									</div>
								</div>
							))}
						</div>
					</div>

					{activeCustomerHistoryDates.length > 0 && (
						<div className="flex items-start gap-3 pt-4 border-t border-black/10 dark:border-white/5">
							<HistoryIcon className="h-4 w-4 mt-0.5 text-gray-500 dark:text-gray-600" />
							<div className="space-y-3 flex-1">
								<span className="block text-xs font-medium text-gray-500 uppercase">
									Booking History ({activeCustomerHistoryDates.length})
								</span>
								<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar content-start">
									{activeCustomerHistoryDates.map((date) => (
										<button
											type="button"
											key={date}
											onClick={() => onHistoryDateClick(parseDateLocal(date))}
											className="inline-flex items-center px-2 py-1 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 text-[10px] font-mono text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-black/30 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
										>
											{safeFormatDate(date, "MMM d, yyyy")}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
