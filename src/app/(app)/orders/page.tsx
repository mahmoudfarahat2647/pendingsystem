"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { OrderFormErrorBoundary } from "@/components/orders/OrderFormErrorBoundary";
import { OrdersToolbar } from "@/components/orders/OrdersToolbar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getOrdersColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { Card, CardContent } from "@/components/ui/card";
import {
	getSelectedIds,
	getVinAutoMoveIds,
	hasMixedVinSelection,
} from "@/domain/order/orderWorkflow";
import { buildReleaseAuthorization } from "@/domain/order/releaseGate";
import { useReleaseGate } from "@/hooks/useReleaseGate";
import { useRowModals } from "@/hooks/useRowModals";

const OrderFormModal = dynamic(
	() => import("@/components/orders/form").then((mod) => mod.OrderFormModal),
	{ ssr: false },
);
const BookingCalendarModal = dynamic(
	() =>
		import("@/components/shared/BookingCalendarModal").then(
			(mod) => mod.BookingCalendarModal,
		),
	{ ssr: false },
);
const EditAttachmentModal = dynamic(
	() =>
		import("@/components/shared/EditAttachmentModal").then(
			(mod) => mod.EditAttachmentModal,
		),
	{ ssr: false },
);
const RowModals = dynamic(
	() => import("@/components/shared/RowModals").then((mod) => mod.RowModals),
	{ ssr: false },
);

import { useOrdersRealtimeSync } from "@/hooks/useOrdersRealtimeSync";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useAppStore } from "@/store/useStore";
import { useOrdersPageHandlers } from "./useOrdersPageHandlers";

export default function OrdersPage() {
	const {
		ordersRowData,
		freezeData,
		gridApi,
		setGridApi,
		selectedRows,
		setSelectedRows,
		isFormModalOpen,
		setIsFormModalOpen,
		isEditMode,
		setIsEditMode,
		isBookingModalOpen,
		setIsBookingModalOpen,
		isBulkAttachmentModalOpen,
		setIsBulkAttachmentModalOpen,
		showDeleteConfirm,
		setShowDeleteConfirm,
		showCommitConfirm,
		setShowCommitConfirm,
		showFilters,
		setShowFilters,
		handleUpdateOrder,
		handleSendToArchive,
		handleSendToFreeze,
		handleSaveOrder,
		handleCommit,
		handleConfirmCommit,
		handleConfirmBooking,
		handleUpdatePartStatus,
		handleSaveBulkAttachment,
		handlePrint,
		handleReserve,
		handleShareToLogistics,
		handleSendToCallList,
		handleDeleteSelected,
		handleSetAllRDate,
		applyCommand,
		draftSaving,
	} = useOrdersPageHandlers();
	const { requestCallRelease } = useReleaseGate();

	const { onSelectAllByVin, isSelectAllByVinDisabled } = useSelectAllByVin(
		selectedRows,
		gridApi,
	);

	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
	);

	const partStatuses = useAppStore((state) => state.partStatuses);
	useOrdersRealtimeSync();

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
			getOrdersColumns(
				partStatuses,
				(row) => handleNoteClick(row, "orders"),
				handleReminderClick,
				handleAttachClick,
			),
		[partStatuses, handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const handleOpenForm = (edit = false) => {
		if (edit && hasMixedVinSelection(selectedRows)) {
			toast.error(
				"Cannot edit multiple VINs at once. Select items with the same VIN to edit.",
			);
			return;
		}
		setIsEditMode(edit);
		setIsFormModalOpen(true);
	};

	return (
		<div className="space-y-6 h-full flex flex-col">
			<InfoLabel data={selectedRows.length === 1 ? selectedRows[0] : null} />

			<Card className="flex-1 flex flex-col border-none bg-transparent shadow-none">
				<CardContent className="p-0 flex-1 flex flex-col space-y-4">
					<OrdersToolbar
						selectedCount={selectedRows.length}
						selectedRows={selectedRows}
						onAddEdit={() => handleOpenForm(selectedRows.length > 0)}
						onDelete={() => setShowDeleteConfirm(true)}
						onCommit={handleCommit}
						onBooking={() => setIsBookingModalOpen(true)}
						onBulkAttach={() => setIsBulkAttachmentModalOpen(true)}
						onPrint={handlePrint}
						onReserve={handleReserve}
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
						onShareToLogistics={handleShareToLogistics}
						onCallList={handleSendToCallList}
						onExtract={() => gridApi?.exportDataAsCsv()}
						onSetAllRDate={handleSetAllRDate}
						onFilterToggle={() => setShowFilters(!showFilters)}
						partStatuses={partStatuses}
						onUpdateStatus={handleUpdatePartStatus}
						rowData={ordersRowData}
						onSelectAllByVin={onSelectAllByVin}
						isSelectAllByVinDisabled={isSelectAllByVinDisabled}
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
							rowData={ordersRowData}
							columnDefs={columns}
							gridStateKey="orders"
							stage="orders"
							readOnly={draftSaving}
							onSelectionChange={setSelectedRows}
							onCellValueChanged={async (params) => {
								if (
									params.colDef.field === "status" &&
									params.newValue !== params.oldValue
								) {
									const newStatus = params.newValue;
									const vin = params.data.vin;

									// 1. Persist the change
									await handleUpdateOrder(params.data.id, {
										status: newStatus,
									});

									// 2. Check for auto-move to Call List
									const vinIds = getVinAutoMoveIds({
										stage: "orders",
										stageRows: ordersRowData,
										editedRowId: params.data.id,
										editedVin: vin,
										nextStatus: newStatus,
										frozenRows: freezeData,
									});

									if (vinIds.length > 0) {
										const vinRows = ordersRowData.filter((r) =>
											vinIds.includes(r.id),
										);
										const gateResult = await requestCallRelease({
											rows: vinRows,
											automatic: true,
										});
										if (gateResult.approvedRows.length > 0) {
											const approvedIds = getSelectedIds(
												gateResult.approvedRows,
											);
											applyCommand({
												type: "moveRows",
												ids: approvedIds,
												sourceStage: "orders",
												destinationStage: "call",
												guardFrozenVins: true,
												releaseAuthorization:
													gateResult.approvedVins.length > 0
														? buildReleaseAuthorization(
																gateResult.approvedRows,
																gateResult.approvedVins,
															)
														: undefined,
											});
											toast.success(
												`All parts for VIN ${vin} arrived! Moved to Call List.`,
												{ duration: 5000 },
											);
										}
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
							onGridReady={(api) => setGridApi(api)}
							showFloatingFilters={showFilters}
							enablePagination={true}
							pageSize={20}
						/>
					</div>
				</CardContent>
			</Card>

			{isFormModalOpen && (
				<OrderFormErrorBoundary>
					<OrderFormModal
						open={isFormModalOpen}
						onOpenChange={(open) => {
							setIsFormModalOpen(open);
						}}
						isEditMode={isEditMode}
						selectedRows={selectedRows}
						onSubmit={handleSaveOrder}
					/>
				</OrderFormErrorBoundary>
			)}

			{currentRow && (
				<RowModals
					activeModal={activeModal}
					currentRow={currentRow}
					onClose={closeModal}
					onSaveNote={saveNote}
					onSaveReminder={saveReminder}
					onSaveAttachment={saveAttachment}
					onSaveArchive={saveArchive}
					onSaveFreeze={saveFreeze}
					sourceTag="orders"
				/>
			)}

			{isBulkAttachmentModalOpen && (
				<EditAttachmentModal
					open={isBulkAttachmentModalOpen}
					onOpenChange={setIsBulkAttachmentModalOpen}
					allowUpload={false}
					onSave={handleSaveBulkAttachment}
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
				onConfirm={handleDeleteSelected}
				title="Delete Orders"
				description={`Are you sure you want to delete ${selectedRows.length} selected order(s)? This action cannot be undone.`}
				confirmText="Delete"
			/>

			<ConfirmDialog
				open={showCommitConfirm}
				onOpenChange={setShowCommitConfirm}
				onConfirm={handleConfirmCommit}
				title="Commit to Main Sheet"
				description="Have you verified the request date for all selected orders before committing?"
				confirmText="Commit"
				cancelText="No, Go Back"
				variant="success"
				requireTypeToConfirm="yes"
			/>
		</div>
	);
}
