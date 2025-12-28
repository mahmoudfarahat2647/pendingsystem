"use client";

import { Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MainSheetToolbar } from "@/components/main-sheet/MainSheetToolbar";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getMainSheetColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function MainSheetPage() {
	const rowData = useAppStore((state) => state.rowData);
	const sendToCallList = useAppStore((state) => state.sendToCallList);
	const partStatuses = useAppStore((state) => state.partStatuses);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);
	const updateOrder = useAppStore((state) => state.updateOrder);
	const deleteOrders = useAppStore((state) => state.deleteOrders);
	const sendToBooking = useAppStore((state) => state.sendToBooking);
	const sendToArchive = useAppStore((state) => state.sendToArchive);

	const [isSheetLocked, setIsSheetLocked] = useState(true);
	const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

	useEffect(() => {
		if (isSheetLocked) {
			setTimeLeft(300);
			return;
		}

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsSheetLocked(true);
					toast.info("Sheet automatically locked after 5 minutes");
					return 300;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [isSheetLocked]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};
	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const handleSelectionChanged = useMemo(() => (rows: PendingRow[]) => {
		setSelectedRows(rows);
	}, []);

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
		() =>
			getMainSheetColumns(
				partStatuses,
				handleNoteClick,
				handleReminderClick,
				handleAttachClick,
				isSheetLocked
			),
		[partStatuses, handleNoteClick, handleReminderClick, handleAttachClick, isSheetLocked],
	);

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => updatePartStatus(row.id, status));
		toast.success(`Part status updated to "${status}"`);
	};

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

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<InfoLabel data={selectedRows[0] || null} />

				<Card className="border-none bg-transparent shadow-none">
					<CardContent className="p-0">
						{!isSheetLocked && (
							<div className="flex items-center justify-between px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-t-lg text-green-400 text-sm">
								<div className="flex items-center gap-2">
									<Unlock className="h-4 w-4" />
									<span>Sheet is unlocked - Editing enabled</span>
								</div>
								<div className="flex items-center gap-2 font-mono font-bold">
									<span className="text-[10px] uppercase tracking-widest text-green-500/50">Auto-lock in</span>
									<span className="text-lg">{formatTime(timeLeft)}</span>
								</div>
							</div>
						)}

						<MainSheetToolbar
							isLocked={isSheetLocked}
							selectedCount={selectedRows.length}
							partStatuses={partStatuses}
							onLockToggle={() => setIsSheetLocked(!isSheetLocked)}
							onUpdateStatus={handleUpdatePartStatus}
							onBooking={() => setIsBookingModalOpen(true)}
							onArchive={() => {
								if (selectedRows.length > 0) {
									handleArchiveClick(selectedRows[0], selectedRows.map(r => r.id));
								}
							}}
							onSendToCallList={() => {
								sendToCallList(selectedRows.map((r) => r.id));
								setSelectedRows([]);
								toast.success("Sent to Call List");
							}}
							onDelete={() => setShowDeleteConfirm(true)}
							onExtract={() => gridApi?.exportDataAsCsv()}
							onFilterToggle={() => setShowFilters(!showFilters)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-0">
						<DataGrid
							rowData={rowData}
							columnDefs={columns}
							onSelectionChanged={setSelectedRows}
							onCellValueChanged={(params) => {
								if (
									params.colDef.field === "partStatus" &&
									params.newValue !== params.oldValue
								) {
									updatePartStatus(params.data.id, params.newValue);
								}
							}}
							readOnly={isSheetLocked}
							onGridReady={(api) => setGridApi(api)}
							showFloatingFilters={showFilters}
						/>
					</CardContent>
				</Card>
			</div>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={saveArchive}
			/>

			<BookingCalendarModal
				open={isBookingModalOpen}
				onOpenChange={setIsBookingModalOpen}
				onConfirm={handleConfirmBooking}
				selectedRows={selectedRows}
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
		</TooltipProvider>
	);
}
