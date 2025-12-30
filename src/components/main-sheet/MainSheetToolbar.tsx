"use client";

import {
	Archive,
	Calendar,
	Download,
	Filter,
	Lock,
	Phone,
	Printer,
	Send,
	Tag,
	Trash2,
	Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PendingRow } from "@/types";
import { cn } from "@/lib/utils";

interface MainSheetToolbarProps {
	isLocked: boolean;
	selectedCount: number;
	selectedRows: PendingRow[];
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onLockToggle: () => void;
	onReserve: () => void;
	onUpdateStatus?: (status: string) => void;
	partStatuses?: any[];
}

export const MainSheetToolbar = ({
	isLocked,
	selectedCount,
	selectedRows = [],
	onBooking,
	onArchive,
	onSendToCallList,
	onDelete,
	onExtract,
	onFilterToggle,
	onLockToggle,
	onReserve,
	onUpdateStatus,
	partStatuses,
}: MainSheetToolbarProps) => {
	const uniqueVins = new Set(selectedRows.map((r) => r.vin).filter(Boolean));
	const isSingleVin = selectedRows.length > 0 && uniqueVins.size === 1;

	return (
		<div className="flex items-center justify-between bg-[#141416] p-2 rounded-xl border border-white/5">
			<div className="flex items-center gap-2">
				<div className="w-px h-6 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-lg h-8 w-8"
							onClick={onReserve}
							disabled={isLocked || selectedCount === 0}
						>
							<Tag className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reserve</TooltipContent>
				</Tooltip>

				<div className="w-px h-6 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
						>
							<Send className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Share</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
						>
							<Printer className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Print</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className={cn(
								"h-8 w-8 transition-colors",
								isSingleVin && !isLocked
									? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
									: "text-gray-600 cursor-not-allowed opacity-50",
							)}
							disabled={isLocked || !isSingleVin}
							onClick={onBooking}
						>
							<Calendar className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{!isSingleVin && selectedCount > 0
							? "Select items for a single VIN to book"
							: isLocked
								? "Sheet is locked"
								: "Booking"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
							disabled={isLocked || selectedCount === 0}
							onClick={onArchive}
						>
							<Archive className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Archive</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={onSendToCallList}
							disabled={isLocked || selectedCount === 0}
							className="text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10 h-8 w-8"
						>
							<Phone className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Send to Call List</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
							onClick={onExtract}
						>
							<Download className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Extract</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
							onClick={onFilterToggle}
						>
							<Filter className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Filter</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex items-center gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className={cn(
								"h-8 w-8 rounded-lg transition-all duration-200",
								isLocked
									? "text-red-500 hover:text-red-400 hover:bg-red-500/10"
									: "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10",
							)}
							onClick={onLockToggle}
						>
							{isLocked ? (
								<Lock className="h-4 w-4" />
							) : (
								<Unlock className="h-4 w-4" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{isLocked ? "Unlock Sheet" : "Lock Sheet"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
							onClick={onDelete}
							disabled={isLocked || selectedCount === 0}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Delete</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};
