"use client";

import type { GridApi } from "ag-grid-community";
import { useCallback, useMemo, useState } from "react";
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
import { exportToLogisticsCSV } from "@/lib/exportUtils";
import { printOrderDocument, printReservationLabels } from "@/lib/printing";
import { generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";

export default function OrdersPage() {
	const ordersRowData = useAppStore((state) => state.ordersRowData);
	const addOrders = useAppStore((state) => state.addOrders);
	const updateOrder = useAppStore((state) => state.updateOrder);
	const updateOrders = useAppStore((state) => state.updateOrders);
	const commitToMainSheet = useAppStore((state) => state.commitToMainSheet);
	const deleteOrders = useAppStore((state) => state.deleteOrders);
	const sendToBooking = useAppStore((state) => state.sendToBooking);
	const sendToArchive = useAppStore((state) => state.sendToArchive);
	const sendToCallList = useAppStore((state) => state.sendToCallList);
	const partStatuses = useAppStore((state) => state.partStatuses);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);

	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [isBulkAttachmentModalOpen, setIsBulkAttachmentModalOpen] =
		useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

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
	} = useRowModals(updateOrder, sendToArchive);

	const columns = useMemo(
		() =>
			getOrdersColumns(
				partStatuses,
				(row) => handleNoteClick(row, "orders"),
				handleReminderClick,
				handleAttachClick,
			),
		[
			partStatuses,
			handleNoteClick,
			handleReminderClick,
			handleAttachClick,
		],
	);

	const handleSelectionChanged = useCallback((rows: PendingRow[]) => {
		setSelectedRows(rows);
	}, []);

	const handleOpenForm = (edit = false) => {
		setIsEditMode(edit);
		setIsFormModalOpen(true);
	};

	const handleSaveOrder = (
		formData: Record<string, unknown>,
		parts: PartEntry[],
	) => {
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
					endWarranty: "",
					remainTime: "",
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
				endWarranty: "",
				remainTime: "",
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

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			updatePartStatus(row.id, status);
		});
		toast.success(`Part status updated to "${status}"`);
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
		printOrderDocument(selectedRows);
	};

	const handleReserve = () => {
		if (selectedRows.length === 0) return;
		printReservationLabels(selectedRows);
	};

	const handleShareToLogistics = () => {
		if (selectedRows.length === 0) return;
		exportToLogisticsCSV(selectedRows);
	};

	const handleSendToCallList = () => {
		if (selectedRows.length === 0) return;
		sendToCallList(selectedRows.map((r) => r.id));
		setSelectedRows([]);
		toast.success(`${selectedRows.length} order(s) sent to Call List`);
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
						/>

						<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
							<DataGrid
								rowData={ordersRowData}
								columnDefs={columns}
								onSelectionChanged={handleSelectionChanged}
								onCellValueChanged={(params) => {
									if (
										params.colDef.field === "partStatus" &&
										params.newValue !== params.oldValue
									) {
										updatePartStatus(params.data.id, params.newValue);
									}
								}}
								onGridReady={(api) => setGridApi(api)}
								showFloatingFilters={showFilters}
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
