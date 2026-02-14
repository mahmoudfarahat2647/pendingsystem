"use client";

import type { GridApi } from "ag-grid-community";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { FormData } from "@/components/orders/OrderFormModal";
import {
	useBulkUpdateOrderStageMutation,
	useDeleteOrderMutation,
	useOrdersQuery,
	useSaveOrderMutation,
} from "@/hooks/queries/useOrdersQuery";
import { exportToLogisticsCSV } from "@/lib/exportUtils";
import { printOrderDocument, printReservationLabels } from "@/lib/printing";
import { calculateEndWarranty, calculateRemainingTime } from "@/lib/utils";
import { BeastModeSchema } from "@/schemas/form.schema";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";

export const useOrdersPageHandlers = () => {
	// 1. Data & Store
	const { data: ordersRowData = [] } = useOrdersQuery("orders");
	const saveOrderMutation = useSaveOrderMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation();

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

	const triggerBeastMode = useAppStore((state) => state.triggerBeastMode);
	const _beastModeTriggers = useAppStore((state) => state.beastModeTriggers);

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
				const row = ordersRowData.find((r: any) => r.id === id);
				let newActionNote = row?.actionNote || "";
				if (reason?.trim()) {
					const taggedNote = `${reason.trim()} #archive`;
					newActionNote = newActionNote
						? `${newActionNote}\n${taggedNote}`
						: taggedNote;
				}

				saveOrderMutation.mutate({
					id,
					updates: { archiveReason: reason, actionNote: newActionNote },
					stage: "archive",
				});
			}
		},
		[saveOrderMutation, ordersRowData],
	);

	const parseCounterReading = (value: FormData["cntrRdg"]) =>
		Number.parseInt(String(value), 10) || 0;

	const buildCommonData = (formData: FormData) => {
		const isWarranty = formData.repairSystem === "ضمان";
		const endWarranty = isWarranty
			? calculateEndWarranty(formData.startWarranty)
			: "";
		const remainTime = isWarranty
			? calculateRemainingTime(endWarranty)
			: "";

		return {
			...formData,
			cntrRdg: parseCounterReading(formData.cntrRdg),
			endWarranty,
			remainTime,
		};
	};

	const buildOrderUpdates = (
		commonData: ReturnType<typeof buildCommonData>,
		part: PartEntry,
		baseId: string,
		requester: string,
	) => ({
		baseId,
		trackingId: `ORD-${baseId}`,
		...commonData,
		partNumber: part.partNumber,
		description: part.description,
		parts: [part],
		status: "Pending",
		rDate: new Date().toISOString().split("T")[0],
		requester,
	});

	const deleteOrdersByIds = async (ids: string[]) => {
		for (const id of ids) {
			await deleteOrderMutation.mutateAsync(id);
		}
	};

	const saveEditedParts = async (formData: FormData, parts: PartEntry[]) => {
		const existingRowIdsInModal = new Set(
			parts.flatMap((part) => (part.rowId ? [part.rowId] : [])),
		);
		const removedRowIds = selectedRows
			.filter((row) => !existingRowIdsInModal.has(row.id))
			.map((row) => row.id);

		if (removedRowIds.length > 0) {
			await deleteOrdersByIds(removedRowIds);
		}

		const commonData = buildCommonData(formData);

		for (const part of parts) {
			if (part.rowId) {
				await saveOrderMutation.mutateAsync({
					id: part.rowId,
					stage: "orders",
					updates: {
						...commonData,
						partNumber: part.partNumber,
						description: part.description,
						parts: [part],
					},
				});
				continue;
			}

			const baseId = String(
				selectedRows[0]?.baseId || Date.now().toString().slice(-6),
			);
			await saveOrderMutation.mutateAsync({
				id: "",
				updates: buildOrderUpdates(commonData, part, baseId, formData.requester),
				stage: "orders",
			});
		}

		toast.success("Grid entries updated successfully");
	};

	const saveNewParts = async (formData: FormData, parts: PartEntry[]) => {
		const baseId = Date.now().toString().slice(-6);
		const commonData = buildCommonData(formData);

		for (let index = 0; index < parts.length; index++) {
			const part = parts[index];
			const partBaseId =
				parts.length > 1 ? `${baseId}-${index + 1}` : baseId;

			await saveOrderMutation.mutateAsync({
				id: "",
				updates: buildOrderUpdates(
					commonData,
					part,
					partBaseId,
					formData.requester,
				),
				stage: "orders",
			});
		}

		toast.success(`${parts.length} order(s) created`);
	};

	const handleSaveOrder = async (formData: FormData, parts: PartEntry[]) => {
		try {
			if (isEditMode) {
				await saveEditedParts(formData, parts);
			} else {
				await saveNewParts(formData, parts);
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
				const errorMessages = result.error.issues
					.map((issue) => {
						const field = issue.path.join(".") || "form";
						return `${field}: ${issue.message}`;
					})
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
			let newActionNote = row.actionNote || "";
			if (note?.trim()) {
				const taggedNote = `${note.trim()} #booking`;
				newActionNote = newActionNote
					? `${newActionNote}\n${taggedNote}`
					: taggedNote;
			}

			await saveOrderMutation.mutateAsync({
				id: row.id,
				updates: {
					bookingDate: date,
					bookingNote: note,
					actionNote: newActionNote,
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
			handleUpdateOrder(row.id, { partStatus: status });
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
