"use client";

import type {
	CellStyle,
	GridApi,
	ValueFormatterParams,
} from "ag-grid-community";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArchiveToolbar } from "@/components/archive/ArchiveToolbar";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";
import { RowModals } from "@/components/shared/RowModals";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useArchiveModals } from "./useArchiveModals";
import { useArchivePageActions } from "./useArchivePageActions";

export default function ArchivePage() {
	const { t } = useT();
	const { data: archiveRowData = [] } = useOrdersQuery("archive");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("archive");

	// Use draft working rows if available, fallback to query data
	const effectiveData = draftWorkingRows || archiveRowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (archiveRowData) {
			checkNotifications();
		}
	}, [archiveRowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);
	const moveToMainPermission = useAppStore((s) => s.moveToMainPermission);

	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);

	const { onSelectAllByVin, isSelectAllByVinDisabled } = useSelectAllByVin(
		selectedRows,
		gridApi,
	);

	const [showFilters, setShowFilters] = useState(false);
	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
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
		showMoveToMainConfirm,
		setShowMoveToMainConfirm,
		openMoveToMainConfirm,
	} = useArchiveModals();

	const {
		handleUpdateOrder,
		handleSendToArchive,
		handleConfirmBooking,
		handleConfirmReorder,
		handleConfirmMoveToMain,
		handleUpdatePartStatus,
		handleConfirmDelete,
	} = useArchivePageActions({
		applyCommand,
		effectiveRows: effectiveData,
		selectedRows,
		setSelectedRows,
	});

	// Sync selectedRows with the latest effectiveData to prevent stale data
	useSelectedRowsSync("archive", effectiveData, selectedRows, setSelectedRows);

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
	} = useRowModals(handleUpdateOrder, handleSendToArchive);

	const columns = useMemo(() => {
		const baseColumns = getBaseColumns(
			(row) => handleNoteClick(row, "archive"),
			handleReminderClick,
			handleAttachClick,
		);
		return [
			...baseColumns.slice(0, 1),
			{
				headerName: "BOOKING",
				field: "bookingDate",
				width: 120,
				cellStyle: (params: { value: unknown }): CellStyle =>
					params.value
						? { color: "#22c55e", fontWeight: 500 }
						: { color: "#6b7280" },
				valueFormatter: (params: ValueFormatterParams<PendingRow>) => {
					if (!params.value) return "N/A";
					try {
						return format(new Date(params.value), "EEE, MMM d, yyyy");
					} catch {
						return "N/A";
					}
				},
			},
			...baseColumns.slice(1),
			{
				headerName: "REQUESTER",
				field: "requester",
				width: 120,
			},
		];
	}, [partStatuses, handleNoteClick, handleReminderClick, handleAttachClick]);

	return (
		<div className="space-y-4 h-full flex flex-col">
			<InfoLabel data={selectedRows[0] || null} />

			<ArchiveToolbar
				selectedRows={selectedRows}
				partStatuses={partStatuses}
				rowData={effectiveData}
				onExtract={() => gridApi?.exportDataAsCsv()}
				onFilterToggle={() => setShowFilters(!showFilters)}
				onUpdateStatus={handleUpdatePartStatus}
				onReorder={openReorder}
				onBooking={openBooking}
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
					rowData={effectiveData}
					columnDefs={columns}
					gridStateKey="archive"
					stage="archive"
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

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={() => {}}
				sourceTag="archive"
			/>

			<ReorderReasonDialog
				open={isReorderModalOpen}
				onOpenChange={setReorderModalOpen}
				reason={reorderReason}
				onReasonChange={setReorderReason}
				onCancel={closeReorder}
				onConfirm={() => handleConfirmReorder(reorderReason, resetReorder)}
				placeholder={t("modals.reorder.placeholderArchive")}
				helperText={t("modals.reorder.helperBackToOrders")}
			/>

			<BookingCalendarModal
				open={isBookingModalOpen}
				onOpenChange={setBookingModalOpen}
				onConfirm={handleConfirmBooking}
				selectedRows={selectedRows}
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleConfirmDelete}
				title={t("modals.stageConfirm.archiveDeleteTitle")}
				description={t("modals.stageConfirm.archiveDeleteDescription", {
					count: selectedRows.length,
				})}
				confirmText={t("modals.stageConfirm.permanentlyDelete")}
			/>

			<ConfirmDialog
				open={showMoveToMainConfirm}
				onOpenChange={setShowMoveToMainConfirm}
				onConfirm={() => {
					if (!moveToMainPermission) {
						toast.error("Move to Main Sheet permission was turned off.");
						return;
					}
					handleConfirmMoveToMain();
				}}
				variant="success"
				title={t("modals.stageConfirm.moveToMainTitle")}
				description={t("modals.stageConfirm.moveToMainDescription", {
					count: selectedRows.length,
				})}
				confirmText={t("modals.stageConfirm.moveToMainYes")}
				cancelText={t("modals.stageConfirm.moveToMainNo")}
			/>
		</div>
	);
}
