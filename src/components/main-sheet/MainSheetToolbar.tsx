"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	activeFilter?: string | null;
	onFilterChange?: (status: string | null) => void;
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
	partStatuses = [],
	activeFilter,
	onFilterChange,
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

				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
									disabled={isLocked || selectedCount === 0}
								>
									<CheckCircle className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]"
							>
								{partStatuses?.map((status: any) => (
									<DropdownMenuItem
										key={status.id}
										onClick={() => onUpdateStatus?.(status.label)}
										className="flex items-center gap-2 focus:bg-white/5 cursor-pointer"
									>
										<div className={cn("w-2 h-2 rounded-full", status.color)} />
										<span className="text-xs">{status.label}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Update Part Status</TooltipContent>
				</Tooltip>

				<div className="w-px h-6 bg-white/10 mx-1" />

				<div className="flex items-center gap-1.5 px-2">
					{partStatuses?.map((status: any) => (
						<Tooltip key={status.id}>
							<TooltipTrigger asChild>
								<button
									onClick={() => onFilterChange?.(status.label)}
									className={cn(
										"w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 hover:shadow-[0_0_8px_rgba(255,255,255,0.2)]",
										status.color.replace("text-", "bg-").split(" ")[0],
										activeFilter === status.label ? "ring-2 ring-white ring-offset-2 ring-offset-[#141416] scale-110" : "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
									)}
								/>
							</TooltipTrigger>
							<TooltipContent>{status.label}</TooltipContent>
						</Tooltip>
					))}
					{activeFilter && (
						<button
							onClick={() => onFilterChange?.(null)}
							className="text-[10px] text-gray-500 hover:text-gray-300 ml-1 font-bold uppercase tracking-wider"
						>
							Clear
						</button>
					)}
				</div>
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
