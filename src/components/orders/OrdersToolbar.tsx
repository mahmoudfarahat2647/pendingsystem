"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	FileCheck,
	Filter,
	Link,
	Pencil,
	Phone,
	Plus,
	Printer,
	Send,
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
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PartStatus, PendingRow } from "@/types";
import { VINLineCounter } from "@/components/shared/VINLineCounter";

interface OrdersToolbarProps {
	selectedCount: number;
	selectedRows: PendingRow[];
	onAddEdit: () => void;
	onDelete: () => void;
	onCommit: () => void;
	onBooking: () => void;
	onBulkAttach: () => void;
	onPrint: () => void;
	onReserve: () => void;
	onArchive: () => void;
	onShareToLogistics: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	partStatuses?: PartStatus[];
	onUpdateStatus?: (status: string) => void;
	onCallList: () => void;
	rowData?: PendingRow[];
}

export const OrdersToolbar = ({
	selectedCount,
	selectedRows = [],
	onAddEdit,
	onDelete,
	onCommit,
	onBooking,
	onBulkAttach,
	onPrint,
	onReserve,
	onArchive,
	onShareToLogistics,
	onExtract,
	onFilterToggle,
	partStatuses = [],
	onUpdateStatus,
	onCallList,
	rowData = [],
}: OrdersToolbarProps) => {
	const uniqueVins = new Set(selectedRows.map((r) => r.vin).filter(Boolean));
	const isSingleVin = selectedRows.length > 0 && uniqueVins.size === 1;

	return (
		<div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className={cn(
								"transition-all duration-300 h-8 w-8",
								selectedCount > 0
									? "bg-amber-500 hover:bg-amber-600 text-black"
									: "bg-renault-yellow hover:bg-renault-yellow/90 text-black",
							)}
							size="icon"
							onClick={onAddEdit}
						>
							{selectedCount > 0 ? (
								<Pencil className="h-4 w-4" />
							) : (
								<Plus className="h-4 w-4" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{selectedCount > 0
							? `Edit ${selectedCount > 1 ? "Orders" : "Order"}`
							: "Create Order"}
					</TooltipContent>
				</Tooltip>

				<div className="w-px h-5 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
							onClick={onReserve}
							disabled={selectedCount === 0}
						>
							<Tag className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Reserve</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onShareToLogistics}
							disabled={selectedCount === 0}
						>
							<Send className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Share to Logistics</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8 w-8"
							onClick={onBulkAttach}
							disabled={selectedCount === 0}
						>
							<Link className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Set Link / Path</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onPrint}
							disabled={selectedCount === 0}
						>
							<Printer className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Print Order</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							disabled={selectedCount === 0}
							onClick={onArchive}
						>
							<Archive className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Archive</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className={cn(
								"h-8 w-8 transition-colors",
								isSingleVin
									? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
									: "text-gray-600 cursor-not-allowed opacity-50",
							)}
							disabled={!isSingleVin}
							onClick={onBooking}
						>
							<Calendar className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{!isSingleVin && selectedCount > 0
							? "Select items for a single VIN to book"
							: "Booking"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
							onClick={onCallList}
							disabled={selectedCount === 0}
						>
							<Phone className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Send to Call List</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
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

				<div className="w-px h-5 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-gray-400 hover:text-white h-8 w-8"
									disabled={selectedCount === 0}
								>
									<CheckCircle className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]"
							>
								{partStatuses.map((status) => {
									const isHex = status.color?.startsWith("#") || status.color?.startsWith("rgb");
									const dotStyle = isHex ? { backgroundColor: status.color } : undefined;
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
					<TooltipContent>Update Part Status</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="bg-green-600 hover:bg-green-500 text-white border-none rounded-md h-8 w-28"
							onClick={onCommit}
							disabled={selectedCount === 0}
						>
							<FileCheck className="h-5 w-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Commit to Main Sheet</TooltipContent>
				</Tooltip>
			</div>



			<div className="flex items-center gap-1.5">
				<VINLineCounter rows={rowData} />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
							onClick={onDelete}
							disabled={selectedCount === 0}
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
