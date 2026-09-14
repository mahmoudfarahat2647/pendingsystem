"use client";

import type { GridApi } from "ag-grid-community";
import { Unlock } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { MainSheetToolbar } from "@/components/main-sheet/MainSheetToolbar";
import { logger } from "@/lib/logger";

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
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";
import { Card, CardContent } from "@/components/ui/card";
import { filterReservedRows } from "@/domain/order/orderWorkflow";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useMainSheetModals } from "./useMainSheetModals";
import { useMainSheetPageActions } from "./useMainSheetPageActions";

export default function MainSheetPage() {
	const { data: rowData = [] } = useOrdersQuery("main");
	const { data: freezeData = [] } = useOrdersQuery("freeze");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("main");

	// Use draft working rows if available, fallback to query data
	const effectiveRowData = draftWorkingRows || rowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (rowData) {
			checkNotifications();
		}
	}, [rowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);

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
				logger.error("[MainSheet] Auto-lock timer callback failed:", err);
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
	const { onSelectAllByVin, isSelectAllByVinDisabled } = useSelectAllByVin(
		selectedRows,
		gridApi,
	);
	const {
		isReorderModalOpen,
		setReorderModalOpen,
		openReorder,
		closeReorder,
		reorderReason,
		setReorderReason,
		resetReorder,
		isBookingModalOpen,
		setBookingModalOpen,
		openBooking,
		showDeleteConfirm,
		setShowDeleteConfirm,
		openDeleteConfirm,
	} = useMainSheetModals();
	const [showFilters, setShowFilters] = useState(false);
	const [activeFilter, setActiveFilter] = useState<string | null>(null);
	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
	);

	const filteredRowData = useMemo(() => {
		if (!activeFilter) return effectiveRowData;
		return effectiveRowData.filter(
			(row: PendingRow) => row.status === activeFilter,
		);
	}, [effectiveRowData, activeFilter]);

	// Sync selectedRows with the latest filteredRowData to prevent stale data
	// and automatically drop rows that no longer match the active filter
	useSelectedRowsSync("main", filteredRowData, selectedRows, setSelectedRows);

	const {
		handleUpdateOrder,
		handleSendToArchive,
		handleConfirmBooking,
		handleConfirmReorder,
		handleUpdatePartStatus,
		handleSendToCallList,
		handleConfirmDelete,
	} = useMainSheetPageActions({
		applyCommand,
		effectiveRows: effectiveRowData,
		selectedRows,
		setSelectedRows,
		freezeRows: freezeData,
	});

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

	return (
		<>
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
							onSelectAllByVin={onSelectAllByVin}
							isSelectAllByVinDisabled={isSelectAllByVinDisabled}
							onLockToggle={() => setIsSheetLocked(!isSheetLocked)}
							onUpdateStatus={handleUpdatePartStatus}
							onBooking={openBooking}
							onArchive={() => {
								if (selectedRows.length > 0) {
									handleArchiveClick(
										selectedRows[0],
										selectedRows.map((r) => r.id),
									);
								}
							}}
							onReorder={openReorder}
							onSendToCallList={handleSendToCallList}
							onDelete={openDeleteConfirm}
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

						{/* biome-ignore lint/a11y/noStaticElementInteractions: outer wrapper captures contextmenu events; AG Grid owns all real a11y/focus management */}
						<div
							role="presentation"
							className={`flex-1 min-h-[500px] border border-white/10 rounded-xl ${
								scrollDir === "horizontal"
									? "overflow-x-auto overflow-y-hidden"
									: "overflow-hidden"
							}`}
							onContextMenu={(e) => {
								e.preventDefault();
								setScrollDir((d) =>
									d === "vertical" ? "horizontal" : "vertical",
								);
							}}
						>
							<DataGrid
								rowData={filteredRowData}
								columnDefs={columns}
								gridStateKey="main-sheet"
								stage="main"
								onSelectionChange={setSelectedRows}
								onCellValueChanged={async (params) => {
									if (
										params.colDef.field === "rDate" &&
										params.newValue !== params.oldValue
									) {
										const v = params.newValue as string;
										if (!v?.trim() || Number.isNaN(Date.parse(v))) return;
										await handleUpdateOrder(params.data.id, { rDate: v });
									} else if (
										params.colDef.field &&
										params.colDef.field !== "rDate" &&
										params.colDef.field !== "status" &&
										params.newValue !== params.oldValue
									) {
										await handleUpdateOrder(params.data.id, {
											[params.colDef.field]: params.newValue,
										});
									}
								}}
								readOnly={!gridEditPermission || isSheetLocked || draftSaving}
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
					onOpenChange={setBookingModalOpen}
					onConfirm={handleConfirmBooking}
					selectedRows={selectedRows}
				/>
			)}

			<ReorderReasonDialog
				open={isReorderModalOpen}
				onOpenChange={setReorderModalOpen}
				reason={reorderReason}
				onReasonChange={setReorderReason}
				onCancel={closeReorder}
				onConfirm={() => handleConfirmReorder(reorderReason, resetReorder)}
				placeholder="e.g., Customer called back, error on main sheet"
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleConfirmDelete}
				title="Delete Records"
				description={`Are you sure you want to delete ${selectedRows.length} selected record(s)?`}
				confirmText="Delete"
			/>
		</>
	);
}
