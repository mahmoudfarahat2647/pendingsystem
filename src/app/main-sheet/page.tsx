"use client";

import type { GridApi } from "ag-grid-community";
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
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

import { useOrdersQuery, useUpdateOrderStageMutation, useDeleteOrderMutation, useSaveOrderMutation } from "@/hooks/queries/useOrdersQuery";
import { useCallback } from "react";

export default function MainSheetPage() {
	const { data: rowData = [], isLoading } = useOrdersQuery("main");
	const updateStageMutation = useUpdateOrderStageMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const saveOrderMutation = useSaveOrderMutation();

	const partStatuses = useAppStore((state) => state.partStatuses);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);

	const handleUpdateOrder = useCallback((id: string, updates: Partial<PendingRow>) => {
		saveOrderMutation.mutate({ id, ...updates, stage: "main" });
	}, [saveOrderMutation]);

	const handleSendToArchive = useCallback((ids: string[], reason: string) => {
		for (const id of ids) {
			saveOrderMutation.mutate({ id, archiveReason: reason, stage: "archive" });
		}
	}, [saveOrderMutation]);

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
	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [activeFilter, setActiveFilter] = useState<string | null>(null);

	const filteredRowData = useMemo(() => {
		if (!activeFilter) return rowData;
		return rowData.filter((row) => row.partStatus === activeFilter);
	}, [rowData, activeFilter]);

	const _handleSelectionChanged = useMemo(
		() => (rows: PendingRow[]) => {
			setSelectedRows(rows);
		},
		[],
	);

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
	} = useRowModals(handleUpdateOrder, handleSendToArchive);

	const columns = useMemo(
		() =>
			getMainSheetColumns(
				partStatuses,
				(row) => handleNoteClick(row, "main sheet"),
				handleReminderClick,
				handleAttachClick,
				isSheetLocked,
			),
		[
			partStatuses,
			handleNoteClick,
			handleReminderClick,
			handleAttachClick,
			isSheetLocked,
		],
	);

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			updatePartStatus(row.id, status);
		});
		toast.success(`Part status updated to "${status}"`);
	};

	const handleConfirmBooking = async (
		date: string,
		_note: string,
		_status?: string,
	) => {
		for (const row of selectedRows) {
			await updateStageMutation.mutateAsync({ id: row.id, stage: "booking" });
		}
		setSelectedRows([]);
		toast.success(`${selectedRows.length} row(s) sent to Booking`);
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
									<span className="text-[10px] uppercase tracking-widest text-green-500/50">
										Auto-lock in
									</span>
									<span className="text-lg">{formatTime(timeLeft)}</span>
								</div>
							</div>
						)}

						<MainSheetToolbar
							isLocked={isSheetLocked}
							selectedCount={selectedRows.length}
							selectedRows={selectedRows}
							partStatuses={partStatuses}
							activeFilter={activeFilter}
							onFilterChange={(status) => {
								setActiveFilter(status === activeFilter ? null : status);
								if (status) toast.info(`Filtering by: ${status}`);
							}}
							rowData={filteredRowData}
							onLockToggle={() => setIsSheetLocked(!isSheetLocked)}
							onUpdateStatus={handleUpdatePartStatus}
							onBooking={() => setIsBookingModalOpen(true)}
							onArchive={() => {
								if (selectedRows.length > 0) {
									handleArchiveClick(
										selectedRows[0],
										selectedRows.map((r) => r.id),
									);
								}
							}}
							onSendToCallList={async () => {
								for (const row of selectedRows) {
									await updateStageMutation.mutateAsync({ id: row.id, stage: "call" });
								}
								setSelectedRows([]);
								toast.success("Sent to Call List");
							}}
							onDelete={() => setShowDeleteConfirm(true)}
							onExtract={() => gridApi?.exportDataAsCsv()}
							onFilterToggle={() => setShowFilters(!showFilters)}
							onReserve={() => printReservationLabels(selectedRows)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-0">
						<DataGrid
							rowData={filteredRowData}
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
				sourceTag="main sheet"
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
				onConfirm={async () => {
					for (const row of selectedRows) {
						await deleteOrderMutation.mutateAsync(row.id);
					}
					setSelectedRows([]);
					toast.success("Row(s) deleted");
					setShowDeleteConfirm(false);
				}}
				title="Delete Records"
				description={`Are you sure you want to delete ${selectedRows.length} selected record(s)?`}
				confirmText="Delete"
			/>
		</TooltipProvider>
	);
}
