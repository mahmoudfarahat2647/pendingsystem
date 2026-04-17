"use client";

import type { GridApi } from "ag-grid-community";
import { Unlock } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import {
	appendTaggedUserNote,
	filterReservedRows,
	getEffectiveNoteHistory,
	getSelectedIds,
	getVinAutoMoveIds,
} from "@/lib/orderWorkflow";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function MainSheetPage() {
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const { data: rowData = [] } = useOrdersQuery("main");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("main");

	// Use draft working rows if available, fallback to query data
	const effectiveRowData = draftWorkingRows || rowData;

	const partStatuses = useAppStore((state) => state.partStatuses);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "main",
				destinationStage: "main",
				updates,
				previousValues: {},
			});
			return Promise.resolve();
		},
		[applyCommand],
	);

	const handleSendToArchive = useCallback(
		(ids: string[], reason: string) => {
			for (const id of ids) {
				const row = effectiveRowData.find((r) => r.id === id);
				if (row) {
					const newNoteHistory = appendTaggedUserNote(
						getEffectiveNoteHistory(row),
						reason,
						"archive",
					);

					applyCommand({
						type: "patchRow",
						id,
						sourceStage: "main",
						destinationStage: "archive",
						updates: { archiveReason: reason, noteHistory: newNoteHistory },
						previousValues: {},
					});
				}
			}
		},
		[effectiveRowData, applyCommand],
	);

	const [isSheetLocked, setIsSheetLocked] = useState(true);
	const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

	useEffect(() => {
		if (isSheetLocked) {
			setTimeLeft(300);
			return;
		}

		const timer = setInterval(() => {
			try {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsSheetLocked(true);
						toast.info("Sheet automatically locked after 5 minutes");
						return 300;
					}
					return prev - 1;
				});
			} catch (err) {
				console.error("[MainSheet] Auto-lock timer callback failed:", err);
			}
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
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [activeFilter, setActiveFilter] = useState<string | null>(null);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");

	const filteredRowData = useMemo(() => {
		if (!activeFilter) return effectiveRowData;
		return effectiveRowData.filter(
			(row: PendingRow) => row.partStatus === activeFilter,
		);
	}, [effectiveRowData, activeFilter]);

	// Sync selectedRows with the latest filteredRowData to prevent stale data
	// and automatically drop rows that no longer match the active filter
	useSelectedRowsSync("main", filteredRowData, selectedRows, setSelectedRows);

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

	const handleUpdatePartStatus = async (status: string) => {
		if (selectedRows.length === 0) return;

		// 1. Apply patch commands for all status changes
		for (const row of selectedRows) {
			applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "main",
				updates: { partStatus: status },
				previousValues: { partStatus: row.partStatus },
			});
		}

		// 2. Check each unique VIN for auto-move to Call List
		const uniqueVins = [
			...new Set(selectedRows.map((r) => r.vin).filter(Boolean)),
		];

		for (const vin of uniqueVins) {
			// Use the first row edited for that VIN as the editedRowId
			const editedRow = selectedRows.find((r) => r.vin === vin);
			if (!editedRow) continue;

			const vinIds = getVinAutoMoveIds({
				stage: "main",
				stageRows: effectiveRowData,
				editedRowId: editedRow.id,
				editedVin: vin,
				nextPartStatus: status,
			});

			if (vinIds.length > 0) {
				applyCommand({
					type: "moveRows",
					ids: vinIds,
					sourceStage: "main",
					destinationStage: "call",
				});
				toast.success(`All parts for VIN ${vin} arrived! Moved to Call List.`, {
					duration: 5000,
				});
			}
		}

		toast.success(`Part status updated to "${status}"`);
	};

	const handleConfirmReorder = () => {
		if (!reorderReason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		for (const row of selectedRows) {
			const newNoteHistory = appendTaggedUserNote(
				getEffectiveNoteHistory(row),
				`Reorder Reason: ${reorderReason}`,
				"reorder",
			);
			applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "orders",
				updates: {
					noteHistory: newNoteHistory,
					status: "Reorder",
				},
				previousValues: {},
			});
		}
		const count = selectedRows.length;
		setSelectedRows([]);
		setIsReorderModalOpen(false);
		setReorderReason("");
		toast.success(`${count} row(s) sent back to Orders (Reorder)`);
	};

	const handleConfirmBooking = async (
		date: string,
		note: string,
		status?: string,
	) => {
		for (const row of selectedRows) {
			const newNoteHistory = appendTaggedUserNote(
				getEffectiveNoteHistory(row),
				note,
				"booking",
			);

			applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "main",
				destinationStage: "booking",
				updates: {
					bookingDate: date,
					bookingNote: note,
					noteHistory: newNoteHistory,
					...(status ? { bookingStatus: status } : {}),
				},
				previousValues: {},
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
							onReorder={() => setIsReorderModalOpen(true)}
							onSendToCallList={async () => {
								if (selectedRows.length === 0) return;
								const ids = getSelectedIds(selectedRows);
								applyCommand({
									type: "moveRows",
									ids,
									sourceStage: "main",
									destinationStage: "call",
								});
								setSelectedRows([]);
								toast.success(`${ids.length} item(s) sent to Call List`);
							}}
							onDelete={() => setShowDeleteConfirm(true)}
							onExtract={() => gridApi?.exportDataAsCsv()}
							onFilterToggle={() => setShowFilters(!showFilters)}
							onReserve={() => {
								const reservedRows = filterReservedRows(
									selectedRows,
									partStatuses,
								);
								if (reservedRows.length === 0) return;
								printReservationLabels(reservedRows);
							}}
						/>

						<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
							<DataGrid
								rowData={filteredRowData}
								columnDefs={columns}
								gridStateKey="main-sheet"
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
										const vinIds = getVinAutoMoveIds({
											stage: "main",
											stageRows: effectiveRowData,
											editedRowId: params.data.id,
											editedVin: vin,
											nextPartStatus: newStatus,
										});

										if (vinIds.length > 0) {
											applyCommand({
												type: "moveRows",
												ids: vinIds,
												sourceStage: "main",
												destinationStage: "call",
											});
											toast.success(
												`All parts for VIN ${vin} arrived! Moved to Call List.`,
												{
													duration: 5000,
												},
											);
										}
									} else if (
										params.colDef.field === "rDate" &&
										params.newValue !== params.oldValue
									) {
										const v = params.newValue as string;
										if (!v?.trim() || Number.isNaN(Date.parse(v))) return;
										await handleUpdateOrder(params.data.id, { rDate: v });
									}
								}}
								readOnly={isSheetLocked || draftSaving}
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

			{/* Reorder Reason Modal */}
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
								placeholder="e.g., Customer called back, error on main sheet"
								className="bg-white/5 border-white/10 text-white"
							/>
						</div>
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

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={async () => {
					const ids = getSelectedIds(selectedRows);
					applyCommand({
						type: "deleteRows",
						ids,
					});
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
