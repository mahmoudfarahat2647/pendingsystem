"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	Phone,
	RotateCcw,
	Tag,
	Trash2,
} from "lucide-react";
import { RowValueFilter } from "@/components/shared/RowValueFilter";
import {
	SEARCH_SOURCES,
	type SearchSource,
} from "@/components/shared/search/searchSources";
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
import type { RowValueFilterOption } from "@/lib/rowValueFilter";
import { cn } from "@/lib/utils";
import type { PartStatusDef } from "@/types";

export interface SearchToolbarProps {
	selectedCount: number;
	isSameSource: boolean;
	disabledReason: string;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onReorder: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onReserve: () => void;
	onUpdateStatus?: (status: string) => void;
	partStatuses?: PartStatusDef[];
	showFilters: boolean;
	modelOptions: RowValueFilterOption[];
	selectedModels: string[];
	onModelsChange: (value: string[]) => void;
	sourceOptions: SearchSource[];
	activeSourceFilter: SearchSource | null;
	onSourceFilterChange: (source: SearchSource | null) => void;
}

export const SearchToolbar = ({
	selectedCount,
	isSameSource,
	disabledReason,
	onBooking,
	onArchive,
	onSendToCallList,
	onReorder,
	onDelete,
	onExtract,
	onFilterToggle,
	onReserve,
	onUpdateStatus,
	partStatuses = [],
	showFilters,
	modelOptions,
	selectedModels,
	onModelsChange,
	sourceOptions,
	activeSourceFilter,
	onSourceFilterChange,
}: SearchToolbarProps) => {
	const isReserveDisabled = selectedCount === 0;
	const isStageActionDisabled = selectedCount === 0 || !isSameSource;

	return (
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
							className={cn(
								"h-8 w-8 transition-colors",
								!isStageActionDisabled
									? "text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10"
									: "text-gray-600 cursor-not-allowed opacity-50",
							)}
							disabled={isStageActionDisabled}
							onClick={onReorder}
						>
							<RotateCcw className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{!isSameSource && selectedCount > 0 ? disabledReason : "Reorder"}
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
											<span
												className="text-xs font-semibold"
												style={isHex ? { color: status.color } : undefined}
											>
												{status.label}
											</span>
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>
						{!isSameSource && selectedCount > 0
							? disabledReason
							: "Update Status"}
					</TooltipContent>
				</Tooltip>

				<div className="w-px h-6 bg-white/10 mx-1" />

				<div className="flex items-center gap-1.5 px-2">
					{SEARCH_SOURCES.map(({ source, dotColor, activeRingColor }) => {
						const isAvailable = sourceOptions.includes(source);
						const isActive = activeSourceFilter === source;

						return (
							<Tooltip key={source}>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label={source}
										aria-pressed={isActive}
										disabled={!isAvailable}
										onClick={() => onSourceFilterChange(source)}
										className={cn(
											"w-3 h-3 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#141416]",
											dotColor,
											!isAvailable && "opacity-20 cursor-default",
											isAvailable &&
												(isActive
													? cn(
															"ring-1 ring-offset-1 ring-offset-[#141416]",
															activeRingColor,
														)
													: "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 cursor-pointer"),
										)}
									/>
								</TooltipTrigger>
								<TooltipContent>{source}</TooltipContent>
							</Tooltip>
						);
					})}
					{activeSourceFilter && (
						<button
							type="button"
							onClick={() => onSourceFilterChange(null)}
							className="text-[10px] text-gray-500 hover:text-gray-300 ml-1 font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:underline"
						>
							Clear
						</button>
					)}
				</div>

				<RowValueFilter
					options={modelOptions}
					value={selectedModels}
					onChange={onModelsChange}
					placeholder="Car model"
					ariaLabel="Filter car model"
					emptyText="No car models found."
				/>
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
	);
};
