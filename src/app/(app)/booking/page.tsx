"use client";

import type { GridApi } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getBookingColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { MoveToMainConfirmDialog } from "@/components/shared/MoveToMainConfirmDialog";
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";
import { RowModals } from "@/components/shared/RowModals";
import {
	filterReservedRows,
	hasMixedVinSelection,
} from "@/domain/order/orderWorkflow";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { useT } from "@/hooks/useT";
import { trySelectRowsByVin } from "@/lib/ag-grid-helpers";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useBookingModals } from "./useBookingModals";
import { useBookingPageActions } from "./useBookingPageActions";

export default function BookingPage() {
	const { t } = useT();
	const { data: bookingRowData = [] } = useOrdersQuery("booking");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
		dirty: draftDirty,
	} = useDraftSession("booking");

	// Use draft working rows if available, fallback to query data
	const effectiveBookingData = draftWorkingRows || bookingRowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const pendingVinSelection = useAppStore((state) => state.pendingVinSelection);
	const setPendingVinSelection = useAppStore(
		(state) => state.setPendingVinSelection,
	);

	useEffect(() => {
		if (bookingRowData) {
			checkNotifications();
		}
	}, [bookingRowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);
	const moveToMainPermission = useAppStore((s) => s.moveToMainPermission);

	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const {
		handleUpdateOrder,
		handleSendToArchive,
		handleSendToFreeze,
		handleConfirmReorder,
		handleConfirmRebooking,
		handleConfirmMoveToMain,
		handleUpdatePartStatus,
		handleConfirmDelete,
	} = useBookingPageActions({
		applyCommand,
		effectiveRows: effectiveBookingData,
		selectedRows,
		setSelectedRows,
	});
	const { onSelectAllByVin, isSelectAllByVinDisabled } = useSelectAllByVin(
		selectedRows,
		gridApi,
	);
	const hasMixedVins = hasMixedVinSelection(selectedRows);

	useEffect(() => {
		if (!pendingVinSelection || !gridApi) return;
		const vin =
			typeof pendingVinSelection === "string"
				? pendingVinSelection
				: pendingVinSelection.vin;
		const bookingDate =
			typeof pendingVinSelection === "string"
				? undefined
				: pendingVinSelection.bookingDate;
		const matched = trySelectRowsByVin(gridApi, vin, bookingDate);
		if (matched) setPendingVinSelection(null);
	}, [
		pendingVinSelection,
		gridApi,
		effectiveBookingData,
		setPendingVinSelection,
	]);
	const {
		isReorderModalOpen,
		setReorderModalOpen,
		openReorder,
		closeReorder,
		reorderReason,
		setReorderReason,
		resetReorder,
		isRebookingModalOpen,
		setRebookingModalOpen,
		openRebooking,
		closeRebooking,
		showDeleteConfirm,
		setShowDeleteConfirm,
		openDeleteConfirm,
		closeDeleteConfirm,
		showMoveToMainConfirm,
		setShowMoveToMainConfirm,
		openMoveToMainConfirm,
	} = useBookingModals();
	const [showFilters, setShowFilters] = useState(false);
	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
	);

	// Sync selectedRows with the latest effectiveBookingData to prevent stale data
	useSelectedRowsSync(
		"booking",
		effectiveBookingData,
		selectedRows,
		setSelectedRows,
	);

	const {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		handleArchiveClick,
		handleFreezeClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
		saveFreeze,
	} = useRowModals(handleUpdateOrder, handleSendToArchive, handleSendToFreeze);

	const columns = useMemo(
		() =>
			getBookingColumns(
				partStatuses,
				(row) => handleNoteClick(row, "booking"),
				handleReminderClick,
				handleAttachClick,
			),
		[partStatuses, handleNoteClick, handleReminderClick, handleAttachClick],
	);

	return (
		<div className="space-y-4 h-full flex flex-col">
			<InfoLabel data={selectedRows[0] || null} />

			<BookingToolbar
				selectedRows={selectedRows}
				partStatuses={partStatuses}
				rowData={effectiveBookingData}
				draftDirty={draftDirty}
				hasMixedVins={hasMixedVins}
				onExtract={() => gridApi?.exportDataAsCsv()}
				onFilterToggle={() => setShowFilters((v) => !v)}
				onReserve={() => {
					const reservedRows = filterReservedRows(selectedRows, partStatuses);
					if (reservedRows.length === 0) return;
					printReservationLabels(reservedRows);
				}}
				onUpdateStatus={handleUpdatePartStatus}
				onArchive={() => {
					if (selectedRows.length > 0) {
						handleArchiveClick(
							selectedRows[0],
							selectedRows.map((r) => r.id),
						);
					}
				}}
				onFreeze={() => {
					if (selectedRows.length > 0) {
						handleFreezeClick(
							selectedRows[0],
							selectedRows.map((r) => r.id),
						);
					}
				}}
				onRebook={openRebooking}
				onReorder={openReorder}
				onMoveToMain={openMoveToMainConfirm}
				canMoveToMain={moveToMainPermission}
				onDelete={openDeleteConfirm}
				onSelectAllByVin={onSelectAllByVin}
				isSelectAllByVinDisabled={isSelectAllByVinDisabled}
			/>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: outer wrapper captures contextmenu events; AG Grid owns all real a11y/focus management */}
			<div
				role="presentation"
				className={`flex-1 min-h-[500px] border border-white/10 rounded-xl mt-4 ${
					scrollDir === "horizontal"
						? "overflow-x-auto overflow-y-hidden"
						: "overflow-hidden"
				}`}
				onContextMenu={(e) => {
					e.preventDefault();
					setScrollDir((d) => (d === "vertical" ? "horizontal" : "vertical"));
				}}
			>
				<DataGrid
					rowData={effectiveBookingData}
					columnDefs={columns}
					gridStateKey="booking"
					stage="booking"
					readOnly={!gridEditPermission || draftSaving}
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
					onGridReady={(api) => setGridApi(api)}
					showFloatingFilters={showFilters}
					enablePagination={true}
					pageSize={20}
				/>
			</div>

			<ReorderReasonDialog
				open={isReorderModalOpen}
				onOpenChange={setReorderModalOpen}
				reason={reorderReason}
				onReasonChange={setReorderReason}
				onCancel={closeReorder}
				onConfirm={() => handleConfirmReorder(reorderReason, resetReorder)}
				placeholder={t("modals.reorder.placeholderWrongPart")}
				helperText={t("modals.reorder.helperBackToOrders")}
				srDescription={t("modals.reorder.srDescription")}
			/>

			<BookingCalendarModal
				open={isRebookingModalOpen}
				onOpenChange={setRebookingModalOpen}
				selectedRows={selectedRows}
				onConfirm={(date, note, status) =>
					handleConfirmRebooking(date, note, status, closeRebooking)
				}
			/>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={saveArchive}
				onSaveFreeze={saveFreeze}
				sourceTag="booking"
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={async () => {
					await handleConfirmDelete(closeDeleteConfirm);
				}}
				title={t("modals.stageConfirm.bookingDeleteTitle")}
				description={t("modals.stageConfirm.bookingDeleteDescription", {
					count: selectedRows.length,
				})}
				confirmText={t("modals.stageConfirm.delete")}
			/>

			<MoveToMainConfirmDialog
				open={showMoveToMainConfirm}
				onOpenChange={setShowMoveToMainConfirm}
				count={selectedRows.length}
				onConfirm={handleConfirmMoveToMain}
			/>
		</div>
	);
}
