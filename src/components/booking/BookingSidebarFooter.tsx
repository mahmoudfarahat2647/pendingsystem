import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingSidebarFooterProps {
	selectedRowsLength: number;
	searchQuery: string;
	selectedDate: Date;
	bookingNote: string;
	preBookingStatus: string;
	onConfirm: (date: string, note: string, status?: string) => void;
	onNoteReset: () => void;
	onStatusReset: () => void;
	isDateInPast?: boolean;
}

export const BookingSidebarFooter = ({
	selectedRowsLength,
	searchQuery,
	selectedDate,
	bookingNote,
	preBookingStatus,
	onConfirm,
	onNoteReset,
	onStatusReset,
	isDateInPast,
}: BookingSidebarFooterProps) => {
	const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
	const getFooterButtonContent = () => {
		if (selectedRowsLength === 0) {
			return "Select Items First";
		}

		if (searchQuery) {
			return "Clear Search to Book";
		}

		if (isDateInPast) {
			return "Cannot Book in Past";
		}

		return (
			<span className="flex items-center gap-2">
				<Calendar className="h-4 w-4" />
				Confirm {format(selectedDate, "MMM d")}
			</span>
		);
	};
	const footerButtonContent = getFooterButtonContent();

	return (
		<div className="p-6 bg-[#0a0a0b] border-t border-white/5">
			<Button
				onClick={() => {
					onConfirm(selectedDateKey, bookingNote, preBookingStatus);
					onNoteReset();
					onStatusReset();
				}}
				disabled={!!searchQuery || selectedRowsLength === 0 || isDateInPast}
				className={cn(
					"h-12 w-full rounded-xl font-bold transition-all text-xs tracking-widest uppercase",
					selectedRowsLength === 0 || searchQuery
						? "bg-gray-900 border-white/5 text-gray-700 shadow-none pointer-events-none"
						: "bg-renault-yellow hover:bg-renault-yellow/90 text-black shadow-[0_0_20px_rgba(255,206,0,0.2)]",
				)}
			>
				{footerButtonContent}
			</Button>
		</div>
	);
};
