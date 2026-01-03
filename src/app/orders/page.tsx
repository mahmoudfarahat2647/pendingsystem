"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { OrderFormModal } from "@/components/orders/OrderFormModal";
import { OrdersToolbar } from "@/components/orders/OrdersToolbar";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { getOrdersColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useOrdersPageHandlers } from "./useOrdersPageHandlers";

export default function OrdersPage() {
	const {
		ordersRowData,
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
		showFilters,
		setShowFilters,
		handleUpdateOrder,
		handleSendToArchive,
		handleSaveOrder,
		handleCommit,
		handleConfirmBooking,
		handleUpdatePartStatus,
		handleSaveBulkAttachment,
		handlePrint,
		handleReserve,
		handleShareToLogistics,
		handleSendToCallList,
		handleDeleteSelected,
		updateStageMutation,
	} = useOrdersPageHandlers();

	const partStatuses = useAppStore((state) => state.partStatuses);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);

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
			getOrdersColumns(
				partStatuses,
				(row) => handleNoteClick(row, "orders"),
				handleReminderClick,
				handleAttachClick,
			),
		[partStatuses, handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const handleOpenForm = (edit = false) => {
		setIsEditMode(edit);
		setIsFormModalOpen(true);
	};

	return (
		<TooltipProvider>
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
							onShareToLogistics={handleShareToLogistics}
							onCallList={handleSendToCallList}
							onExtract={() => gridApi?.exportDataAsCsv()}
							onFilterToggle={() => setShowFilters(!showFilters)}
							partStatuses={partStatuses}
							onUpdateStatus={handleUpdatePartStatus}
							rowData={ordersRowData}
						/>

						<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
							<DataGrid
								rowData={ordersRowData}
								columnDefs={columns}
								onSelectionChange={setSelectedRows}
								onCellValueChanged={async (params) => {
									if (
										params.colDef.field === "partStatus" &&
										params.newValue !== params.oldValue
									) {
										const newStatus = params.newValue;
										const vin = params.data.vin;

										// 1. Persist the change
										handleUpdateOrder(params.data.id, {
											partStatus: newStatus,
										});

										// 2. Check for auto-move to Call List
										// [CRITICAL] AUTO-MOVE FEATURE - DO NOT REMOVE
										if (newStatus === "Arrived" && vin) {
											const vinParts = ordersRowData.filter(
												(r) => r.vin === vin,
											);
											const allArrived = vinParts.every((r) => {
												if (r.id === params.data.id) return true;
												return r.partStatus === "Arrived";
											});

											if (allArrived && vinParts.length > 0) {
												for (const part of vinParts) {
													await updateStageMutation.mutateAsync({
														id: part.id,
														stage: "call",
													});
												}
												toast.success(
													`All parts for VIN ${vin} arrived! Moved to Call List.`,
													{ duration: 5000 },
												);
											}
										}
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

				<OrderFormModal
					open={isFormModalOpen}
					onOpenChange={setIsFormModalOpen}
					isEditMode={isEditMode}
					selectedRows={selectedRows}
					onSubmit={handleSaveOrder}
				/>

				<RowModals
					activeModal={activeModal}
					currentRow={currentRow}
					onClose={closeModal}
					onSaveNote={saveNote}
					onSaveReminder={saveReminder}
					onSaveAttachment={saveAttachment}
					onSaveArchive={saveArchive}
					sourceTag="orders"
				/>

				<EditAttachmentModal
					open={isBulkAttachmentModalOpen}
					onOpenChange={setIsBulkAttachmentModalOpen}
					initialPath=""
					onSave={handleSaveBulkAttachment}
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
					onConfirm={handleDeleteSelected}
					title="Delete Orders"
					description={`Are you sure you want to delete ${selectedRows.length} selected order(s)? This action cannot be undone.`}
					confirmText="Delete"
				/>
			</div>
		</TooltipProvider>
	);
}
