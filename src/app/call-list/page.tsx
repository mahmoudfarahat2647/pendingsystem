"use client";

import {
	Calendar,
	Download,
	Filter,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function CallListPage() {
	const {
		callRowData,
		sendToBooking,
		sendToReorder,
		deleteOrders,
		updateOrder,
		sendToArchive,
		isLocked,
	} = useAppStore();

	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		handleArchiveClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
	} = useRowModals(updateOrder, sendToArchive);

	const columns = useMemo(
		() => getBaseColumns(handleNoteClick, handleReminderClick, handleAttachClick, isLocked),
		[handleNoteClick, handleReminderClick, handleAttachClick, isLocked],
	);

	const handleConfirmBooking = (
		date: string,
		note: string,
		status?: string,
	) => {
		const ids = selectedRows.map((r) => r.id);
		sendToBooking(ids, date, note, status);
		setSelectedRows([]);
		toast.success(`${ids.length} row(s) sent to Booking`);
	};

	const handleConfirmReorder = () => {
		if (!reorderReason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		const ids = selectedRows.map((r) => r.id);
		sendToReorder(ids, reorderReason);
		setSelectedRows([]);
		setIsReorderModalOpen(false);
		setReorderReason("");
		toast.success(`${ids.length} row(s) sent back to Orders (Reorder)`);
	};

	const handleDelete = () => {
		if (selectedRows.length === 0) {
			toast.error("Please select at least one row");
			return;
		}
		setShowDeleteConfirm(true);
	};

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<InfoLabel data={selectedRows[0] || null} />

				<div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
									onClick={() => gridApi?.exportDataAsCsv()}
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
									onClick={() => setShowFilters(!showFilters)}
								>
									<Filter className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Filter</TooltipContent>
						</Tooltip>

						<div className="w-px h-5 bg-white/10 mx-1" />

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-green-500/80 hover:text-green-500 h-8 w-8"
									disabled={selectedRows.length === 0 || isLocked}
									onClick={() => setIsBookingModalOpen(true)}
								>
									<Calendar className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Send to Booking</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
									disabled={selectedRows.length === 0 || isLocked}
									onClick={() => setIsReorderModalOpen(true)}
								>
									<RotateCcw className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Send to Reorder</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
									onClick={handleDelete}
									disabled={selectedRows.length === 0 || isLocked}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<Card>
					<CardContent className="p-0">
						<DataGrid
							rowData={callRowData}
							columnDefs={columns}
							onSelectionChanged={setSelectedRows}
							onGridReady={(api) => setGridApi(api)}
							showFloatingFilters={showFilters}
						/>
					</CardContent>
				</Card>

				<Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
					<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
						<DialogHeader>
							<DialogTitle className="text-orange-500">
								Reorder - Reason Required
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label>Reason for Reorder</Label>
								<Input
									value={reorderReason}
									onChange={(e) => setReorderReason(e.target.value)}
									placeholder="e.g., Wrong part, Customer cancelled"
									className="bg-white/5 border-white/10 text-white"
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								This will send the selected items back to the Orders view.
							</p>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsReorderModalOpen(false)}
								className="border-white/20 text-white hover:bg-white/10"
							>
								Cancel
							</Button>
							<Button
								variant="renault"
								onClick={handleConfirmReorder}
								disabled={!reorderReason.trim()}
							>
								Confirm Reorder
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<BookingCalendarModal
					open={isBookingModalOpen}
					onOpenChange={setIsBookingModalOpen}
					onConfirm={handleConfirmBooking}
					selectedRows={selectedRows}
				/>

				<RowModals
					activeModal={activeModal}
					currentRow={currentRow}
					onClose={closeModal}
					onSaveNote={saveNote}
					onSaveReminder={saveReminder}
					onSaveAttachment={saveAttachment}
					onSaveArchive={saveArchive}
				/>

				<ConfirmDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
					onConfirm={() => {
						deleteOrders(selectedRows.map((r) => r.id));
						setSelectedRows([]);
						toast.success("Row(s) deleted");
					}}
					title="Delete Records"
					description={`Are you sure you want to delete ${selectedRows.length} selected record(s)?`}
					confirmText="Delete"
				/>
			</div>
		</TooltipProvider>
	);
}
