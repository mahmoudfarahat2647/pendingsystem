"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { OrderFormModal } from "@/components/orders/OrderFormModal";
import { OrdersToolbar } from "@/components/orders/OrdersToolbar";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { getOrdersColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRowModals } from "@/hooks/useRowModals";
import { generateId, getCalculatorValues } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";
import { printOrders } from "@/lib/printUtils";

export default function OrdersPage() {
	const {
		ordersRowData,
		addOrders,
		updateOrder,
		updateOrders,
		commitToMainSheet,
		deleteOrders,
		sendToBooking,
	} = useAppStore();

	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [isBulkAttachmentModalOpen, setIsBulkAttachmentModalOpen] =
		useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
			getOrdersColumns(handleNoteClick, handleReminderClick, handleAttachClick),
		[handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const handleSelectionChanged = (rows: PendingRow[]) => {
		setSelectedRows(rows);
	};

	const handleOpenForm = (edit = false) => {
		setIsEditMode(edit);
		setIsFormModalOpen(true);
	};

	const handleSaveOrder = (formData: any, parts: PartEntry[]) => {
		const warrantyCalc = getCalculatorValues(formData.startWarranty);

		if (isEditMode) {
			const existingRowIdsInModal = new Set(
				parts.map((p) => p.rowId).filter(Boolean),
			);
			const removedRowIds = selectedRows
				.filter((row) => !existingRowIdsInModal.has(row.id))
				.map((row) => row.id);

			if (removedRowIds.length > 0) deleteOrders(removedRowIds);

			const newOrders: PendingRow[] = [];
			parts.forEach((part) => {
				const commonData = {
					...formData,
					cntrRdg: parseInt(formData.cntrRdg, 10) || 0,
					endWarranty: warrantyCalc?.endDate || "",
					remainTime: warrantyCalc?.remainTime || "",
				};

				if (part.rowId) {
					updateOrder(part.rowId as string, {
						...commonData,
						partNumber: part.partNumber,
						description: part.description,
						parts: [part],
					});
				} else {
					const baseId =
						selectedRows[0]?.baseId || Date.now().toString().slice(-6);
					newOrders.push({
						id: generateId(),
						baseId,
						trackingId: `ORD-${baseId}`,
						...commonData,
						partNumber: part.partNumber,
						description: part.description,
						parts: [part],
						status: "Ordered",
						rDate: new Date().toISOString().split("T")[0],
						requester: formData.requester,
					});
				}
			});

			if (newOrders.length > 0) addOrders(newOrders);
			toast.success("Grid entries updated successfully");
		} else {
			const baseId = Date.now().toString().slice(-6);
			const newOrders: PendingRow[] = parts.map((part, index) => ({
				id: generateId(),
				baseId: parts.length > 1 ? `${baseId}-${index + 1}` : baseId,
				trackingId: `ORD-${parts.length > 1 ? `${baseId}-${index + 1}` : baseId}`,
				...formData,
				cntrRdg: parseInt(formData.cntrRdg, 10) || 0,
				partNumber: part.partNumber,
				description: part.description,
				parts: [part],
				status: "Ordered",
				rDate: new Date().toISOString().split("T")[0],
				endWarranty: warrantyCalc?.endDate || "",
				remainTime: warrantyCalc?.remainTime || "",
			}));
			addOrders(newOrders);
			toast.success(`${newOrders.length} order(s) created`);
		}
		setIsFormModalOpen(false);
	};

	const handleCommit = () => {
		if (selectedRows.length === 0) return;
		const rowsWithoutPaths = selectedRows.filter(
			(row) => !row.attachmentPath?.trim(),
		);
		if (rowsWithoutPaths.length > 0) {
			toast.error(
				`${rowsWithoutPaths.length} order(s) missing attachment paths.`,
			);
			return;
		}
		commitToMainSheet(selectedRows.map((r) => r.id));
		setSelectedRows([]);
		toast.success("Committed to Main Sheet");
	};

	const handleConfirmBooking = (
		date: string,
		note: string,
		status?: string,
	) => {
		const ids = selectedRows.map((r) => r.id);
		sendToBooking(ids, date, note, status);
		setSelectedRows([]);
		toast.success(`${ids.length} order(s) sent to Booking`);
	};

	const handleSaveBulkAttachment = (path: string | undefined) => {
		if (selectedRows.length === 0) return;
		updateOrders(
			selectedRows.map((r) => r.id),
			{
				attachmentPath: path,
				hasAttachment: !!path,
			},
		);
		toast.success(path ? "Bulk link updated" : "Bulk link cleared");
		setIsBulkAttachmentModalOpen(false);
	};

	const handlePrint = () => {
		if (selectedRows.length === 0) return;
		printOrders(selectedRows);
	};

	return (
		<TooltipProvider>
			<div className="space-y-6 h-full flex flex-col">
				<InfoLabel data={selectedRows.length === 1 ? selectedRows[0] : null} />

				<Card className="flex-1 flex flex-col border-none bg-transparent shadow-none">
					<CardContent className="p-0 flex-1 flex flex-col space-y-4">
						<OrdersToolbar
							selectedCount={selectedRows.length}
							onAddEdit={() => handleOpenForm(selectedRows.length > 0)}
							onDelete={() => setShowDeleteConfirm(true)}
							onCommit={handleCommit}
							onBooking={() => setIsBookingModalOpen(true)}
							onBulkAttach={() => setIsBulkAttachmentModalOpen(true)}
							onPrint={handlePrint}
						/>

						<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
							<DataGrid
								rowData={ordersRowData}
								columnDefs={columns}
								onSelectionChanged={handleSelectionChanged}
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
					onConfirm={() => {
						deleteOrders(selectedRows.map((r) => r.id));
						setSelectedRows([]);
						toast.success("Order(s) deleted");
					}}
					title="Delete Orders"
					description={`Are you sure you want to delete ${selectedRows.length} selected order(s)? This action cannot be undone.`}
					confirmText="Delete"
				/>
			</div>
		</TooltipProvider>
	);
}
