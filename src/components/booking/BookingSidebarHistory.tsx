import { format } from "date-fns";
import { History as HistoryIcon } from "lucide-react";

interface BookingSidebarHistoryProps {
	activeCustomerHistoryDates: string[];
	onHistoryDateClick: (date: Date) => void;
}

export const BookingSidebarHistory = ({
	activeCustomerHistoryDates,
	onHistoryDateClick,
}: BookingSidebarHistoryProps) => {
	return (
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
	);
};
