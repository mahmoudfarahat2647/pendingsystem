"use client";

import type { GridApi } from "ag-grid-community";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FormData } from "@/components/orders/OrderFormModal";
import {
	useDeleteOrderMutation,
	useOrdersQuery,
	useSaveOrderMutation,
	useBulkUpdateOrderStageMutation,
} from "@/hooks/queries/useOrdersQuery";
import { BeastModeSchema } from "@/schemas/form.schema";
import { exportToLogisticsCSV } from "@/lib/exportUtils";
import { printOrderDocument, printReservationLabels } from "@/lib/printing";
import { calculateEndWarranty, calculateRemainingTime } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";

export const useOrdersPageHandlers = () => {
	// 1. Data & Store
	const { data: ordersRowData = [] } = useOrdersQuery("orders");
	const saveOrderMutation = useSaveOrderMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation();

	const setOrdersRowData = useAppStore((state) => state.setOrdersRowData);
	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const updatePartStatus = useAppStore((state) => state.updatePartStatus);

	// 2. Local State
	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const [isBulkAttachmentModalOpen, setIsBulkAttachmentModalOpen] =
		useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [activeModal, setActiveModal] = useState<{
		type: "note" | "reminder" | "archive" | "attachment";
		row: PendingRow;
	} | null>(null);

	const triggerBeastMode = useAppStore((state) => state.triggerBeastMode);
	const beastModeTriggers = useAppStore((state) => state.beastModeTriggers);
	useEffect(() => {
		if (ordersRowData) {
			setOrdersRowData(ordersRowData);
			checkNotifications();
		}
	}, [ordersRowData, setOrdersRowData, checkNotifications]);

	// 4. Core Handlers
	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			return saveOrderMutation.mutateAsync({ id, updates, stage: "orders" });
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

	const handleSaveOrder = async (formData: FormData, parts: PartEntry[]) => {
		try {
			if (isEditMode) {
				const existingRowIdsInModal = new Set(
					parts.map((p) => p.rowId).filter(Boolean),
				);
				const removedRowIds = selectedRows
					.filter((row) => !existingRowIdsInModal.has(row.id))
					.map((row) => row.id);

				if (removedRowIds.length > 0) {
					for (const id of removedRowIds) {
						await deleteOrderMutation.mutateAsync(id);
					}
				}

				for (const part of parts) {
					const isWarranty = formData.repairSystem === "ضمان";
					const endWarranty = isWarranty
						? calculateEndWarranty(formData.startWarranty)
						: "";
					const remainTime = isWarranty
						? calculateRemainingTime(endWarranty)
						: "";

					const commonData = {
						...formData,
						cntrRdg: parseInt(formData.cntrRdg, 10) || 0,
						endWarranty,
						remainTime,
					};

					if (part.rowId) {
						await saveOrderMutation.mutateAsync({
							id: part.rowId as string,
							stage: "orders",
							updates: {
								...commonData,
								partNumber: part.partNumber,
								description: part.description,
								parts: [part],
							},
						});
					} else {
						const baseId =
							selectedRows[0]?.baseId || Date.now().toString().slice(-6);
						await saveOrderMutation.mutateAsync({
							id: "", // orderService handles new row creation if id is missing/empty, but here we expect saveOrder to handle it. Actually orderService.saveOrder expects id if it's an update.
							updates: {
								baseId,
								trackingId: `ORD-${baseId}`,
								...commonData,
								partNumber: part.partNumber,
								description: part.description,
								parts: [part],
								status: "Ordered",
								rDate: new Date().toISOString().split("T")[0],
								requester: formData.requester,
							},
							stage: "orders",
						});
					}
				}

				toast.success("Grid entries updated successfully");
			} else {
				const baseId = Date.now().toString().slice(-6);
				for (let index = 0; index < parts.length; index++) {
					const part = parts[index];
					const isWarranty = formData.repairSystem === "ضمان";
					const endWarranty = isWarranty
						? calculateEndWarranty(formData.startWarranty)
						: "";
					const remainTime = isWarranty
						? calculateRemainingTime(endWarranty)
						: "";

					await saveOrderMutation.mutateAsync({
						id: "",
						updates: {
							baseId: parts.length > 1 ? `${baseId}-${index + 1}` : baseId,
							trackingId: `ORD-${parts.length > 1 ? `${baseId}-${index + 1}` : baseId}`,
							...formData,
							cntrRdg: parseInt(formData.cntrRdg, 10) || 0,
							partNumber: part.partNumber,
							description: part.description,
							parts: [part],
							status: "Ordered",
							rDate: new Date().toISOString().split("T")[0],
							endWarranty,
							remainTime,
						},
						stage: "orders",
					});
				}
				toast.success(`${parts.length} order(s) created`);
			}
			setIsFormModalOpen(false);
		} catch (error: unknown) {
			const dbError = error as {
				message?: string;
				hint?: string;
				details?: string;
			};
			const errorMessage =
				dbError?.message || dbError?.hint || dbError?.details || String(error);
			console.error("Error saving order:", errorMessage, error);
			toast.error(`Error saving order: ${errorMessage}`);
		}
	};

	const handleCommit = async () => {
		if (selectedRows.length === 0) return;

		// 1. Validate against Beast Mode rules
		const invalidRows: { id: string; errors: string[] }[] = [];
		for (const row of selectedRows) {
			const validationPayload = {
				...row,
				cntrRdg: row.cntrRdg || 0, // Ensure it passed as number (schema handles both)
			};
			const result = BeastModeSchema.safeParse(validationPayload);
			if (!result.success) {
				const errorMessages = Object.entries(result.error.flatten().fieldErrors)
					.map(([field, msgs]) => `${field}: ${msgs?.[0]}`)
					.join(", ");
				invalidRows.push({
					id: row.trackingId || "Unknown",
					errors: [errorMessages],
				});
				// CRITICAL: BEAST MODE TRIGGER - SYNC WITH MODAL TIMER
				// Records timestamp to enforce 30s deadline even if modal is closed.
				triggerBeastMode(row.id, Date.now());
			}
		}

		if (invalidRows.length > 0) {
			const first = invalidRows[0];
			toast.error(
				`Validation Failed for Order ${first.id}: ${first.errors[0]}. Please edit the order to complete strict requirements.`,
			);
			return;
		}

		// 2. Attachment Check
		const rowsWithoutPaths = selectedRows.filter(
			(row) => !row.attachmentPath?.trim(),
		);

		if (rowsWithoutPaths.length > 0) {
			toast.error(
				`${rowsWithoutPaths.length} order(s) missing attachment paths.`,
			);
			return;
		}
		const ids = selectedRows.map((r) => r.id);
		await bulkUpdateStageMutation.mutateAsync({ ids, stage: "main" });
		setSelectedRows([]);
		toast.success("Committed to Main Sheet");
	};

	const handleConfirmBooking = async (
		date: string,
		note: string,
		status?: string,
	) => {
		const ids = selectedRows.map((r) => r.id);

		// 1. Update details first (optimistic)
		for (const row of selectedRows) {
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

		// 2. Move stage (bulk)
		await bulkUpdateStageMutation.mutateAsync({ ids, stage: "booking" });
		setSelectedRows([]);
		toast.success(`${selectedRows.length} order(s) sent to Booking`);
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
		for (const row of selectedRows) {
			handleUpdateOrder(row.id, {
				attachmentPath: path,
				hasAttachment: !!path,
			});
		}
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

	const handleSendToCallList = async () => {
		if (selectedRows.length === 0) return;
		const ids = selectedRows.map((r) => r.id);
		await bulkUpdateStageMutation.mutateAsync({ ids, stage: "call" });
		setSelectedRows([]);
		toast.success(`${selectedRows.length} order(s) sent to Call List`);
	};

	const handleDeleteSelected = async () => {
		for (const row of selectedRows) {
			await deleteOrderMutation.mutateAsync(row.id);
		}
		setSelectedRows([]);
		toast.success("Order(s) deleted");
		setShowDeleteConfirm(false);
	};

	return {
		// Data
		ordersRowData,

		// State
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

		// Handlers
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
		bulkUpdateStageMutation,
	};
};
