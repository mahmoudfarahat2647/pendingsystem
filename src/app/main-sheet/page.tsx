"use client";

import { Unlock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MainSheetToolbar } from "@/components/main-sheet/MainSheetToolbar";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getMainSheetColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function MainSheetPage() {
	const {
		rowData,
		sendToCallList,
		partStatuses,
		updatePartStatus,
		updateOrder,
		deleteOrders,
		sendToBooking,
	} = useAppStore();

	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isLocked, setIsLocked] = useState(true);
	const [showUnlockDialog, setShowUnlockDialog] = useState(false);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);
	const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const [autoLockCountdown, setAutoLockCountdown] = useState<number | null>(
		null,
	);

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
			getMainSheetColumns(
				partStatuses,
				handleNoteClick,
				handleReminderClick,
				handleAttachClick,
			),
		[partStatuses, handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const resetAutoLockTimer = useCallback(() => {
		if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
		if (countdownIntervalRef.current)
			clearInterval(countdownIntervalRef.current);

		if (!isLocked) {
			autoLockTimerRef.current = setTimeout(
				() => {
					setIsLocked(true);
					setAutoLockCountdown(null);
					toast.info(
						"Sheet automatically locked after 5 minutes of inactivity",
					);
				},
				5 * 60 * 1000,
			);

			const countdownStart = 5 * 60;
			setAutoLockCountdown(countdownStart);
			countdownIntervalRef.current = setInterval(() => {
				setAutoLockCountdown((prev) =>
					prev === null || prev <= 1
						? (clearInterval(countdownIntervalRef.current!), null)
						: prev - 1,
				);
			}, 1000);
		}
	}, [isLocked]);

	useEffect(() => {
		resetAutoLockTimer();
		const events = ["mousedown", "keydown", "scroll", "touchstart"];
		const resetTimer = () => resetAutoLockTimer();
		events.forEach((event) => document.addEventListener(event, resetTimer));
		return () => {
			events.forEach((event) =>
				document.removeEventListener(event, resetTimer),
			);
			if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
			if (countdownIntervalRef.current)
				clearInterval(countdownIntervalRef.current);
		};
	}, [resetAutoLockTimer]);

	const handleLockToggle = () => {
		if (isLocked) setShowUnlockDialog(true);
		else {
			setIsLocked(true);
			if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
			if (countdownIntervalRef.current)
				clearInterval(countdownIntervalRef.current);
			setAutoLockCountdown(null);
		}
	};

	const confirmUnlock = () => {
		setIsLocked(false);
		setShowUnlockDialog(false);
		resetAutoLockTimer();
	};

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
						{!isLocked && (
							<div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-t-lg text-green-400 text-sm">
								<Unlock className="h-4 w-4" />
								<span>Sheet is unlocked - Editing enabled</span>
								{autoLockCountdown !== null && (
									<span className="ml-auto text-xs">
										Auto-lock in: {Math.floor(autoLockCountdown / 60)}:
										{String(autoLockCountdown % 60).padStart(2, "0")}
									</span>
								)}
							</div>
						)}

						<MainSheetToolbar
							isLocked={isLocked}
							selectedCount={selectedRows.length}
							partStatuses={partStatuses}
							onLockToggle={handleLockToggle}
							onUpdateStatus={handleUpdatePartStatus}
							onBooking={() => setIsBookingModalOpen(true)}
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
							readOnly={isLocked}
							onGridReady={(api) => setGridApi(api)}
							showFloatingFilters={showFilters}
						/>
					</CardContent>
				</Card>
			</div>

			<Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
				<DialogContent className="sm:max-w-[425px] bg-[#1c1c1e] border border-white/10 text-white">
					<DialogHeader>
						<DialogTitle>Unlock Sheet</DialogTitle>
						<DialogDescription className="text-gray-400">
							Are you sure you want to unlock the sheet? This will allow editing
							and copy-paste operations.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setShowUnlockDialog(false)}
							className="border-white/20 text-white hover:bg-white/10"
						>
							Cancel
						</Button>
						<Button
							onClick={confirmUnlock}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Yes, Unlock
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
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
