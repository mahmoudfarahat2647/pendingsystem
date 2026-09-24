"use client";

import type { GridApi } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { CallListToolbar } from "@/components/call-list/CallListToolbar";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getCallColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";
import { RowModals } from "@/components/shared/RowModals";
import { filterReservedRows } from "@/domain/order/orderWorkflow";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { useT } from "@/hooks/useT";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import {
	filterRowsByValues,
	getRepairSystemValue,
	getRowValueFilterOptions,
} from "@/lib/rowValueFilter";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useCallListModals } from "./useCallListModals";
import { useCallListPageActions } from "./useCallListPageActions";

export default function CallListPage() {
	const { t } = useT();
	const { data: callRowData = [] } = useOrdersQuery("call");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("call");

	// Use draft working rows if available, fallback to query data
	const effectiveData = draftWorkingRows || callRowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (callRowData) {
			checkNotifications();
		}
	}, [callRowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);

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
	} = useCallListModals();
	const [showFilters, setShowFilters] = useState(false);
	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
	);
	const [selectedRepairSystems, setSelectedRepairSystems] = useState<string[]>(
		[],
	);

	const repairSystemOptions = useMemo(
		() => getRowValueFilterOptions(effectiveData, getRepairSystemValue),
		[effectiveData],
	);

	const filteredEffectiveData = useMemo(
		() =>
			filterRowsByValues(
				effectiveData,
				selectedRepairSystems,
				getRepairSystemValue,
			),
		[effectiveData, selectedRepairSystems],
	);

	useEffect(() => {
		setSelectedRepairSystems((current) => {
			const availableValues = new Set(
				repairSystemOptions.map((option) => option.value),
			);
			const next = current.filter((value) => availableValues.has(value));
			return next.length === current.length ? current : next;
		});
	}, [repairSystemOptions]);

	// Sync selectedRows with the latest effectiveData to prevent stale data
	useSelectedRowsSync(
		"call",
		filteredEffectiveData,
		selectedRows,
		setSelectedRows,
	);

	const {
		handleUpdateOrder,
		handleSendToArchive,
		handleSendToFreeze,
		handleConfirmBooking,
		handleConfirmReorder,
		handleUpdatePartStatus,
		handleDelete,
		handleConfirmDelete,
	} = useCallListPageActions({
		applyCommand,
		effectiveRows: effectiveData,
		selectedRows,
		setSelectedRows,
	});

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

	const columns = useMemo(() => {
		return getCallColumns(
			partStatuses,
			handleNoteClick,
			handleReminderClick,
			handleAttachClick,
		);
	}, [partStatuses, handleNoteClick, handleReminderClick, handleAttachClick]);

	return (
		<div className="space-y-4 h-full flex flex-col">
			<InfoLabel data={selectedRows[0] || null} />

			<CallListToolbar
				selectedRows={selectedRows}
				partStatuses={partStatuses}
				rowData={filteredEffectiveData}
				repairSystemOptions={repairSystemOptions}
				selectedRepairSystems={selectedRepairSystems}
				onRepairSystemsChange={setSelectedRepairSystems}
				onExtract={() => gridApi?.exportDataAsCsv()}
				onFilterToggle={() => setShowFilters(!showFilters)}
				onReserve={() => {
					const reservedRows = filterReservedRows(selectedRows, partStatuses);
					if (reservedRows.length === 0) return;
					printReservationLabels(reservedRows);
				}}
				onUpdateStatus={handleUpdatePartStatus}
				onSendToBooking={openBooking}
				onReorder={openReorder}
				onArchive={() =>
					handleArchiveClick(
						selectedRows[0],
						selectedRows.map((r) => r.id),
					)
				}
				onFreeze={() =>
					handleFreezeClick(
						selectedRows[0],
						selectedRows.map((r) => r.id),
					)
				}
				onDelete={() => handleDelete(() => openDeleteConfirm())}
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
					rowData={filteredEffectiveData}
					columnDefs={columns}
					gridStateKey="call-list"
					stage="call"
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
			/>

			<BookingCalendarModal
				open={isBookingModalOpen}
				onOpenChange={setBookingModalOpen}
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
				onSaveFreeze={saveFreeze}
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleConfirmDelete}
				title={t("modals.stageConfirm.recordsDeleteTitle")}
				description={t("modals.stageConfirm.recordsDeleteDescription", {
					count: selectedRows.length,
				})}
				confirmText={t("modals.stageConfirm.delete")}
			/>
		</div>
	);
}
