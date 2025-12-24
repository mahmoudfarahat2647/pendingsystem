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

	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
	const [rebookingSearchTerm, setRebookingSearchTerm] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
		<div className="space-y-4">
			<InfoLabel data={selectedRows[0] || null} />

			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" /> Service Appointments
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Scheduled maintenance
							</p>
						</div>
						<div className="text-sm">
							<span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded">
								Unique Bookings
							</span>
							<span className="ml-2 text-renault-yellow font-semibold">
								{uniqueVins} Unique ({bookingRowData.length} Lines)
							</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={selectedRows.length === 0}
						>
							<Trash2 className="h-4 w-4 mr-1" /> Delete
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => sendToArchive(selectedRows.map((r) => r.id))}
							disabled={selectedRows.length === 0}
						>
							<Archive className="h-4 w-4 mr-1" /> Archive
						</Button>
						<Button
							variant={selectedRows.length === 0 ? "outline" : "outline"}
							size="sm"
							className={cn(
								"border-renault-yellow/20",
								selectedRows.length === 0
									? "text-gray-400"
									: "text-renault-yellow hover:text-renault-yellow/80 hover:bg-renault-yellow/10",
							)}
							onClick={() => {
								setRebookingSearchTerm(
									selectedRows[0]?.vin || selectedRows[0]?.customerName || "",
								);
								setIsRebookingModalOpen(true);
							}}
							disabled={new Set(selectedRows.map((r) => r.vin)).size > 1}
						>
							{selectedRows.length === 0 ? (
								<>
									<HistoryIcon className="h-4 w-4 mr-1" /> History
								</>
							) : (
								<>
									<Calendar className="h-4 w-4 mr-1" /> Rebooking
								</>
							)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="text-orange-500"
							onClick={() => setIsReorderModalOpen(true)}
							disabled={selectedRows.length === 0}
						>
							<RotateCcw className="h-4 w-4 mr-1" /> Reorder
						</Button>
						<Button variant="outline" size="sm">
							<Download className="h-4 w-4 mr-1" /> Extract
						</Button>
						<Button variant="outline" size="sm">
							<Filter className="h-4 w-4 mr-1" /> Filter
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					<DataGrid
						rowData={bookingRowData}
						columnDefs={columns}
						onSelectionChanged={setSelectedRows}
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
		</div>
	);
}
