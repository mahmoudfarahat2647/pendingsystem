"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	RotateCcw,
	Snowflake,
	Tag,
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

interface BookingToolbarProps {
	selectedRows: PendingRow[];
	partStatuses?: PartStatusDef[];
	rowData?: PendingRow[];
	draftDirty: boolean;
	hasMixedVins: boolean;
	onExtract: () => void;
	onFilterToggle: () => void;
	onReserve: () => void;
	onUpdateStatus: (statusLabel: string) => void;
	onArchive: () => void;
	onFreeze: () => void;
	onRebook: () => void;
	onReorder: () => void;
	onDelete: () => void;
	onSelectAllByVin: () => void;
	isSelectAllByVinDisabled: boolean;
}

export const BookingToolbar = ({
	selectedRows = [],
	partStatuses = [],
	rowData = [],
	draftDirty,
	hasMixedVins,
	onExtract,
	onFilterToggle,
	onReserve,
	onUpdateStatus,
	onArchive,
	onFreeze,
	onRebook,
	onReorder,
	onDelete,
	onSelectAllByVin,
	isSelectAllByVinDisabled,
}: BookingToolbarProps) => {
	const { locale } = useTranslation();
	const { isDirty, isPositionDirty, saveLayout, saveAsDefault, resetLayout } =
		useColumnLayoutTracker("booking");

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
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onReserve}
							disabled={selectedRows.length === 0}
						>
							<Tag className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reserve/Print Label</TooltipContent>
				</Tooltip>

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
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onArchive}
							disabled={selectedRows.length === 0 || hasMixedVins}
						>
							<Archive className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{hasMixedVins ? "Mixed customers selected" : "Archive"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-8 w-8"
							onClick={onFreeze}
							disabled={selectedRows.length === 0 || hasMixedVins}
						>
							<Snowflake className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{hasMixedVins ? "Mixed customers selected" : "Freeze"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-green-500/80 hover:text-green-500 h-8 w-8"
							onClick={onRebook}
							disabled={selectedRows.length === 0 || draftDirty || hasMixedVins}
						>
							<Calendar className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{hasMixedVins
							? "Mixed customers selected"
							: draftDirty
								? "Save draft first"
								: "Reschedule Booking"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
							onClick={onReorder}
							disabled={selectedRows.length === 0 || hasMixedVins}
						>
							<RotateCcw className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{hasMixedVins ? "Mixed customers selected" : "Reorder"}
					</TooltipContent>
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
};
