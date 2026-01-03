import { ChevronRight, MessageSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BookingStatus, PendingRow } from "@/types";

interface BookingSidebarHeaderProps {
	selectedRows: PendingRow[];
	preBookingStatus: string;
	setPreBookingStatus: (status: string) => void;
	bookingStatuses: BookingStatus[];
	bookingNote: string;
	setBookingNote: (note: string) => void;
	onClose: () => void;
}

export const BookingSidebarHeader = ({
	selectedRows,
	preBookingStatus,
	setPreBookingStatus,
	bookingStatuses,
	bookingNote,
	setBookingNote,
	onClose,
}: BookingSidebarHeaderProps) => {
	if (selectedRows.length === 0)
		return (
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
			>
				<X className="h-4 w-4" />
			</button>
		);

	return (
		<div className="p-6 border-b border-indigo-500/10 bg-indigo-500/[0.02] space-y-4">
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
			>
				<X className="h-4 w-4" />
			</button>
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
									{(() => {
										const color =
											bookingStatuses.find((s) => s.label === preBookingStatus)
												?.color || "bg-gray-500";
										const isHex =
											color.startsWith("#") || color.startsWith("rgb");
										return (
											<div
												className={cn("w-2 h-2 rounded-full", !isHex && color)}
												style={{ backgroundColor: isHex ? color : undefined }}
											/>
										);
									})()}
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
									type="button"
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
									<span className="text-xs font-semibold">{status.label}</span>
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
	);
};
