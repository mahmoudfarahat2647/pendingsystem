"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	Phone,
	Tag,
	Trash2,
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
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PartStatusDef } from "@/types";

interface SearchToolbarProps {
	selectedCount: number;
	isSameSource: boolean;
	disabledReason: string;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onReserve: () => void;
	onUpdateStatus?: (status: string) => void;
	partStatuses?: PartStatusDef[];
	showFilters: boolean;
}

export const SearchToolbar = ({
	selectedCount,
	isSameSource,
	disabledReason,
	onBooking,
	onArchive,
	onSendToCallList,
	onDelete,
	onExtract,
	onFilterToggle,
	onReserve,
	onUpdateStatus,
	partStatuses = [],
	showFilters,
}: SearchToolbarProps) => {
	const isReserveDisabled = selectedCount === 0;
	const isStageActionDisabled = selectedCount === 0 || !isSameSource;

	return (
		<TooltipProvider>
			<div className="flex items-center justify-between bg-[#141416] p-2 px-6 border-b border-white/5">
				<div className="flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon"
								className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-lg h-8 w-8"
								onClick={onReserve}
								disabled={isReserveDisabled}
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
								type="button"
								variant="ghost"
								size="icon"
								className={cn(
									"h-8 w-8 transition-colors",
									!isStageActionDisabled
										? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
										: "text-gray-600 cursor-not-allowed opacity-50",
								)}
								disabled={isStageActionDisabled}
								onClick={onBooking}
							>
								<Calendar className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{!isSameSource && selectedCount > 0 ? disabledReason : "Booking"}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
								disabled={isStageActionDisabled}
								onClick={onArchive}
							>
								<Archive className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{!isSameSource && selectedCount > 0 ? disabledReason : "Archive"}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={onSendToCallList}
								disabled={isStageActionDisabled}
								className="text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10 h-8 w-8"
							>
								<Phone className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{!isSameSource && selectedCount > 0
								? disabledReason
								: "Send to Call List"}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
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
								type="button"
								variant="ghost"
								size="icon"
								className={cn(
									"h-8 w-8 transition-colors",
									showFilters
										? "bg-white/10 text-white"
										: "text-gray-400 hover:text-white hover:bg-white/5",
								)}
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
										type="button"
										variant="ghost"
										size="icon"
										className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8"
										disabled={isStageActionDisabled}
									>
										<CheckCircle className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]"
								>
									{partStatuses?.map((status) => {
										const isHex =
											status.color?.startsWith("#") ||
											status.color?.startsWith("rgb");
										const dotStyle = isHex
											? { backgroundColor: status.color }
											: undefined;
										const colorClass = isHex ? "" : status.color;

										return (
											<DropdownMenuItem
												key={status.id}
												onClick={() => onUpdateStatus?.(status.label)}
												className="flex items-center gap-2 focus:bg-white/5 cursor-pointer"
											>
												<div
													className={cn("w-2 h-2 rounded-full", colorClass)}
													style={dotStyle}
												/>
												<span className="text-xs">{status.label}</span>
											</DropdownMenuItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						</TooltipTrigger>
						<TooltipContent>
							{!isSameSource && selectedCount > 0
								? disabledReason
								: "Update Part Status"}
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
								onClick={onDelete}
								disabled={isStageActionDisabled}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{!isSameSource && selectedCount > 0 ? disabledReason : "Delete"}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</TooltipProvider>
	);
};
