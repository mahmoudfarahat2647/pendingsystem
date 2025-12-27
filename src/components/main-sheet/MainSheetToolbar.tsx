"use client";

import {
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
	Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PartStatus } from "@/types";

interface MainSheetToolbarProps {
	isLocked: boolean;
	selectedCount: number;
	partStatuses: PartStatus[];
	onUpdateStatus: (status: string) => void;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onLockToggle: () => void;
}

export const MainSheetToolbar = ({
	isLocked,
	selectedCount,
	partStatuses,
	onUpdateStatus,
	onBooking,
	onArchive,
	onSendToCallList,
	onDelete,
	onExtract,
	onFilterToggle,
	onLockToggle,
}: MainSheetToolbarProps) => {
	return (
		<div className="flex items-center justify-between bg-[#141416] p-2 rounded-xl border border-white/5">
			<div className="flex items-center gap-2">
				<div className="w-px h-6 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-lg h-8 w-8"
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
							className="text-green-500/80 hover:text-green-500 hover:bg-green-500/10 h-8 w-8"
							disabled={isLocked || selectedCount === 0}
							onClick={onBooking}
						>
							<Calendar className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Booking</TooltipContent>
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
									: "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
							)}
							onClick={onLockToggle}
						>
							{isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent>{isLocked ? "Unlock Sheet" : "Lock Sheet"}</TooltipContent>
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
