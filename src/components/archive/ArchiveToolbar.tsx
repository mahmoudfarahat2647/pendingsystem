"use client";

import {
	Calendar,
	CheckCircle,
	Download,
	Filter,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { LayoutSaveButton } from "@/components/shared/LayoutSaveButton";
import { SelectAllByVinButton } from "@/components/shared/SelectAllByVinButton";
import { VINLineCounter } from "@/components/shared/VINLineCounter";
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
import { useColumnLayoutTracker } from "@/hooks/useColumnLayoutTracker";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveStatusLabel } from "@/lib/locale/statusLabel";
import { cn } from "@/lib/utils";
import type { PartStatusDef, PendingRow } from "@/types";

export interface ArchiveToolbarProps {
	selectedRows: PendingRow[];
	partStatuses?: PartStatusDef[];
	rowData?: PendingRow[];
	onExtract: () => void;
	onFilterToggle: () => void;
	onUpdateStatus: (statusLabel: string) => void;
	onReorder: () => void;
	onBooking: () => void;
	onDelete: () => void;
	onSelectAllByVin: () => void;
	isSelectAllByVinDisabled: boolean;
}

export function ArchiveToolbar({
	selectedRows = [],
	partStatuses = [],
	rowData = [],
	onExtract,
	onFilterToggle,
	onUpdateStatus,
	onReorder,
	onBooking,
	onDelete,
	onSelectAllByVin,
	isSelectAllByVinDisabled,
}: ArchiveToolbarProps) {
	const { isDirty, isPositionDirty, saveLayout, saveAsDefault, resetLayout } =
		useColumnLayoutTracker("archive");
	const { locale } = useTranslation();

	return (
		<div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
							onClick={onExtract}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Extract</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onFilterToggle}
						>
							<Filter className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Filter</TooltipContent>
				</Tooltip>

				<LayoutSaveButton
					isDirty={isDirty}
					isPositionDirty={isPositionDirty}
					onSave={saveLayout}
					onSaveAsDefault={saveAsDefault}
					onReset={resetLayout}
				/>

				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-gray-400 hover:text-white h-8 w-8"
									disabled={selectedRows.length === 0}
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
											onClick={() => onUpdateStatus(status.label)}
											className="flex items-center gap-2 focus:bg-white/5 cursor-pointer"
										>
											<div
												className={cn("w-2 h-2 rounded-full", colorClass)}
												style={dotStyle}
											/>
											<span className="text-xs">
											{resolveStatusLabel(status, locale)}
										</span>
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Update Status</TooltipContent>
				</Tooltip>

				<div className="w-px h-5 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
							onClick={onReorder}
							disabled={selectedRows.length === 0}
						>
							<RotateCcw className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reorder</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-green-500/80 hover:text-green-500 h-8 w-8"
							onClick={onBooking}
							disabled={selectedRows.length === 0}
						>
							<Calendar className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reschedule Booking</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex items-center gap-1.5">
				<SelectAllByVinButton
					onSelectAllByVin={onSelectAllByVin}
					isDisabled={isSelectAllByVinDisabled}
				/>
				<VINLineCounter rows={rowData} />
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
							onClick={onDelete}
							disabled={selectedRows.length === 0}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Delete</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}
