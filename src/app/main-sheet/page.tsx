"use client";

import type { GridApi } from "ag-grid-community";
import { Unlock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import dynamic from "next/dynamic";
import { MainSheetToolbar } from "@/components/main-sheet/MainSheetToolbar";

const BookingCalendarModal = dynamic(
	() =>
		import("@/components/shared/BookingCalendarModal").then(
			(mod) => mod.BookingCalendarModal,
		),
	{ ssr: false },
);
const RowModals = dynamic(
	() => import("@/components/shared/RowModals").then((mod) => mod.RowModals),
	{ ssr: false },
);
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getMainSheetColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	useDeleteOrderMutation,
	useOrdersQuery,
	useSaveOrderMutation,
	useUpdateOrderStageMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useRowModals } from "@/hooks/useRowModals";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function MainSheetPage() {
	const { data: rowData = [] } = useOrdersQuery("main");
	const { data: bookingRowData = [] } = useOrdersQuery("booking");
	const updateStageMutation = useUpdateOrderStageMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const saveOrderMutation = useSaveOrderMutation();

	const setRowData = useAppStore((state) => state.setRowData);
	const setBookingRowData = useAppStore((state) => state.setBookingRowData);
	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (rowData) {
			setRowData(rowData);
			checkNotifications();
		}
	}, [rowData, setRowData, checkNotifications]);

	useEffect(() => {
		if (bookingRowData) {
			setBookingRowData(bookingRowData);
		}
	}, [bookingRowData, setBookingRowData]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			return saveOrderMutation.mutateAsync({ id, updates, stage: "main" });
		},
		[saveOrderMutation],
	);

	const handleSendToArchive = useCallback(
		(ids: string[], reason: string) => {
			for (const id of ids) {
				saveOrderMutation.mutate({
					id,
					updates: { archiveReason: reason },
					stage: "archive",
				});
			}
		},
		[saveOrderMutation],
	);

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
		note: string,
		status?: string,
	) => {
		for (const row of selectedRows) {
			// Update stage and save booking details
			await saveOrderMutation.mutateAsync({
				id: row.id,
				updates: {
					bookingDate: date,
					bookingNote: note,
					...(status ? { bookingStatus: status } : {}),
				},
				stage: "booking",
			});
		}
		setSelectedRows([]);
		toast.success(`${selectedRows.length} row(s) sent to Booking`);
	};

	return (
		<TooltipProvider>
			<div className="space-y-4 h-full flex flex-col">
				<InfoLabel data={selectedRows[0] || null} />

				<Card className="flex-1 flex flex-col border-none bg-transparent shadow-none">
					<CardContent className="p-0 flex-1 flex flex-col space-y-4">
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
									await updateStageMutation.mutateAsync({
										id: row.id,
										stage: "call",
									});
								}
								setSelectedRows([]);
								toast.success("Sent to Call List");
							}}
							onDelete={() => setShowDeleteConfirm(true)}
							onExtract={() => gridApi?.exportDataAsCsv()}
							onFilterToggle={() => setShowFilters(!showFilters)}
							onReserve={() => printReservationLabels(selectedRows)}
						/>

						<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
							<DataGrid
								rowData={filteredRowData}
								columnDefs={columns}
								onSelectionChange={setSelectedRows}
								onCellValueChanged={async (params) => {
									if (
										params.colDef.field === "partStatus" &&
										params.newValue !== params.oldValue
									) {
										const newStatus = params.newValue;
										const vin = params.data.vin;

										// 1. Persist the change to Supabase
										await handleUpdateOrder(params.data.id, {
											partStatus: newStatus,
										});

										// 2. Check for auto-move to Call List
										// [CRITICAL] AUTO-MOVE FEATURE - DO NOT REMOVE
										// Implementation: If "Arrived", check all parts for VIN. If all Arrived, move to Call List.
										if (newStatus === "Arrived" && vin) {
											// Find all parts for this same VIN in the current dataset
											const vinParts = rowData.filter((r) => r.vin === vin);

											// Check if every part for this VIN is now "Arrived"
											// (the current row just became "Arrived", so we check the persistent state for others)
											const allArrived = vinParts.every((r) => {
												if (r.id === params.data.id) return true; // Just updated this one
												return r.partStatus === "Arrived";
											});

											if (allArrived && vinParts.length > 0) {
												// Move all parts for this VIN to the "call" stage
												for (const part of vinParts) {
													await updateStageMutation.mutateAsync({
														id: part.id,
														stage: "call",
													});
												}
												toast.success(
													`All parts for VIN ${vin} arrived! Moved to Call List.`,
													{
														duration: 5000,
													},
												);
											}
										}
									}
								}}
								readOnly={isSheetLocked}
								onGridReady={(api) => setGridApi(api)}
								showFloatingFilters={showFilters}
								enablePagination={true}
								pageSize={20}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{currentRow && (
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
			)}

			{isBookingModalOpen && (
				<BookingCalendarModal
					open={isBookingModalOpen}
					onOpenChange={setIsBookingModalOpen}
					onConfirm={handleConfirmBooking}
					selectedRows={selectedRows}
				/>
			)}

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
