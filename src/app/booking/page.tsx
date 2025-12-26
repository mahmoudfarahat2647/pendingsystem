"use client";

import {
	Archive,
	Calendar,
	Download,
	Filter,
	History as HistoryIcon,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBookingColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function BookingPage() {
	const {
		bookingRowData,
		sendToArchive,
		sendToReorder,
		deleteOrders,
		updateOrder,
	} = useAppStore();

	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
	const [rebookingSearchTerm, setRebookingSearchTerm] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
	} = useRowModals(updateOrder);

	const columns = useMemo(
		() =>
			getBookingColumns(
				handleNoteClick,
				handleReminderClick,
				handleAttachClick,
			),
		[handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const uniqueVins = new Set(bookingRowData.map((r) => r.vin)).size;

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

	const handleConfirmRebooking = (newDate: string, newNote: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			const oldDate = row.bookingDate || "Unknown Date";
			const historyLog = `Rescheduled from ${oldDate} to ${newDate}.`;
			const updatedNote = row.bookingNote
				? `${row.bookingNote}\n[System]: ${historyLog} ${newNote}`
				: `[System]: ${historyLog} ${newNote}`;

			updateOrder(row.id, {
				bookingDate: newDate,
				bookingNote: updatedNote.trim(),
			});
		});
		setIsRebookingModalOpen(false);
		setSelectedRows([]);
		toast.success(`Rescheduled ${selectedRows.length} booking(s) successfully`);
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
									className="text-gray-400 hover:text-white h-8 w-8"
									onClick={() => sendToArchive(selectedRows.map((r) => r.id))}
									disabled={selectedRows.length === 0}
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
									className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
									onClick={() => setIsReorderModalOpen(true)}
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
									className={
										selectedRows.length === 0
											? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
											: "bg-renault-yellow hover:bg-renault-yellow/90 text-black border-none rounded-md h-8 w-8"
									}
									size="icon"
									onClick={() => {
										setRebookingSearchTerm(
											selectedRows[0]?.vin || selectedRows[0]?.customerName || "",
										);
										setIsRebookingModalOpen(true);
									}}
									disabled={
										new Set(selectedRows.map((r) => r.vin)).size > 1
									}
								>
									{selectedRows.length === 0 ? (
										<HistoryIcon className="h-4 w-4" />
									) : (
										<Calendar className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{selectedRows.length === 0 ? "History" : "Rebooking"}
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
									onClick={() => setShowDeleteConfirm(true)}
									disabled={selectedRows.length === 0}
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
							rowData={bookingRowData}
							columnDefs={columns}
							onSelectionChanged={setSelectedRows}
							onGridReady={(api) => setGridApi(api)}
							showFloatingFilters={showFilters}
						/>
					</CardContent>
				</Card>

				<Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
					<DialogContent>
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
					open={isRebookingModalOpen}
					onOpenChange={setIsRebookingModalOpen}
					selectedRows={selectedRows}
					initialSearchTerm={rebookingSearchTerm}
					onConfirm={handleConfirmRebooking}
				/>

				<RowModals
					activeModal={activeModal}
					currentRow={currentRow}
					onClose={closeModal}
					onSaveNote={saveNote}
					onSaveReminder={saveReminder}
					onSaveAttachment={saveAttachment}
				/>

				<ConfirmDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
					onConfirm={() => {
						deleteOrders(selectedRows.map((r) => r.id));
						setSelectedRows([]);
						toast.success("Booking(s) deleted");
					}}
					title="Delete Bookings"
					description={`Are you sure you want to delete ${selectedRows.length} selected booking(s)?`}
					confirmText="Delete"
				/>
			</div >
		</TooltipProvider >
	);
}
