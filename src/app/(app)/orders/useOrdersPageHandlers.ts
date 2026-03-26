"use client";

import type { GridApi } from "ag-grid-community";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FormData } from "@/components/orders/form";
import {
	useOrdersQuery,
	useSaveOrderMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { hasAttachment, sanitizeAttachmentLink } from "@/lib/attachment";
import { exportToLogisticsCSV } from "@/lib/exportUtils";
import {
	appendTaggedUserNote,
	filterReservedRows,
	getEffectiveNoteHistory,
	getSelectedIds,
	getVinAutoMoveIds,
} from "@/lib/orderWorkflow";
import { printOrderDocument, printReservationLabels } from "@/lib/printing";
import {
	calculateEndWarranty,
	calculateRemainingTime,
	normalizeMileageAsNumber,
} from "@/lib/utils";
import type { AtomicCommand } from "@/store/slices/draftSessionSlice";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";

export const useOrdersPageHandlers = () => {
	// 1. Data & Store
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
	const { data: ordersRowData = [] } = useOrdersQuery("orders");
	const saveOrderMutation = useSaveOrderMutation();

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("orders");

	// Use draft working rows if available, fallback to query data
	const effectiveOrdersData = draftWorkingRows || ordersRowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);
	const partStatuses = useAppStore((state) => state.partStatuses);

	// 2. Local State
	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [isBulkAttachmentModalOpen, setIsBulkAttachmentModalOpen] =
		useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [_activeModal, _setActiveModal] = useState<{
		type: "note" | "reminder" | "archive" | "attachment";
		row: PendingRow;
	} | null>(null);

	useEffect(() => {
		if (effectiveOrdersData) {
			checkNotifications();
		}
	}, [effectiveOrdersData, checkNotifications]);

	// Sync selectedRows with the latest data (draft or query) to prevent stale data
	useSelectedRowsSync(
		"orders",
		effectiveOrdersData,
		selectedRows,
		setSelectedRows,
	);

	// 4. Core Handlers
	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			applyCommand({
				type: "patchRow",
				id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates,
				previousValues: {},
			});
			// Return a resolved promise for compatibility with existing code expecting mutation result
			return Promise.resolve();
		},
		[applyCommand],
	);

	const handleSendToArchive = useCallback(
		(ids: string[], reason: string) => {
			// Create patchRow commands for each row to add archive reason and note history
			for (const id of ids) {
				const row = effectiveOrdersData.find((r) => r.id === id);
				if (!row) continue;

				const newNoteHistory = appendTaggedUserNote(
					getEffectiveNoteHistory(row),
					reason,
					"archive",
				);

				applyCommand({
					type: "patchRow",
					id,
					sourceStage: "orders",
					destinationStage: "archive",
					updates: { archiveReason: reason, noteHistory: newNoteHistory },
					previousValues: {},
				});
			}
		},
		[effectiveOrdersData, applyCommand],
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

				// Collect all atomic commands so the entire edit is a single undo step
				const editChildren: AtomicCommand[] = [];

				if (removedRowIds.length > 0) {
					editChildren.push({ type: "deleteRows", ids: removedRowIds });
				}

				for (const part of parts) {
					const isWarranty = formData.repairSystem === "ضمان";
					const endWarranty = isWarranty
						? calculateEndWarranty(formData.startWarranty)
						: "";
					const remainTime = isWarranty
						? calculateRemainingTime(endWarranty)
						: "";
					const startWarranty = isWarranty ? formData.startWarranty : "";

					const commonData = {
						...formData,
						cntrRdg: normalizeMileageAsNumber(formData.cntrRdg),
						startWarranty,
						endWarranty,
						remainTime,
					};

					if (part.rowId) {
						editChildren.push({
							type: "patchRow",
							id: part.rowId as string,
							sourceStage: "orders",
							destinationStage: "orders",
							updates: {
								...commonData,
								partNumber: part.partNumber,
								description: part.description,
								parts: [part],
							},
							previousValues: {},
						});
					} else {
						const baseId =
							selectedRows[0]?.baseId || Date.now().toString().slice(-6);
						editChildren.push({
							type: "createRows",
							stage: "orders",
							rows: [
								{
									id: `temp-${crypto.randomUUID()}`,
									baseId,
									trackingId: `ORD-${baseId}`,
									...commonData,
									partNumber: part.partNumber,
									description: part.description,
									parts: [part],
									status: "Pending",
									rDate: new Date().toISOString().split("T")[0],
									requester: formData.requester,
									stage: "orders",
								} as PendingRow,
							],
						});
					}
				}

				if (editChildren.length === 1) {
					applyCommand(editChildren[0]);
				} else if (editChildren.length > 1) {
					applyCommand({
						type: "composite",
						label: "Edit order",
						children: editChildren,
					});
				}

				toast.success("Grid entries updated successfully");
			} else {
				const baseId = Date.now().toString().slice(-6);
				const newRows: PendingRow[] = parts.map((part, index) => {
					const isWarranty = formData.repairSystem === "ضمان";
					const endWarranty = isWarranty
						? calculateEndWarranty(formData.startWarranty)
						: "";
					const remainTime = isWarranty
						? calculateRemainingTime(endWarranty)
						: "";
					const startWarranty = isWarranty ? formData.startWarranty : "";

					return {
						id: `temp-${crypto.randomUUID()}`,
						baseId: parts.length > 1 ? `${baseId}-${index + 1}` : baseId,
						trackingId: `ORD-${parts.length > 1 ? `${baseId}-${index + 1}` : baseId}`,
						...formData,
						startWarranty,
						cntrRdg: normalizeMileageAsNumber(formData.cntrRdg),
						partNumber: part.partNumber,
						description: part.description,
						parts: [part],
						status: "Pending",
						rDate: new Date().toISOString().split("T")[0],
						endWarranty,
						remainTime,
						stage: "orders",
					} as PendingRow;
				});

				applyCommand({
					type: "createRows",
					stage: "orders",
					rows: newRows,
				});

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

		const ids = selectedRows.map((r) => r.id);

		// Beast Mode validation is handled inside applyCommand — it returns false if rejected.
		const applied = applyCommand({
			type: "moveRows",
			ids,
			sourceStage: "orders",
			destinationStage: "main",
		});

		if (applied) {
			setSelectedRows([]);
			toast.success("Committed to Main Sheet");
		}
	};

	const handleConfirmBooking = async (
		date: string,
		note: string,
		status?: string,
	) => {
		// Part number + description required before booking
		const rowsMissingParts = selectedRows.filter(
			(row) => !row.partNumber?.trim() || !row.description?.trim(),
		);
		if (rowsMissingParts.length > 0) {
			toast.error(
				`${rowsMissingParts.length} order(s) missing part number or description. Complete all part fields before booking.`,
			);
			return;
		}

		// 1. Update details first (optimistic)
		for (const row of selectedRows) {
			const newNoteHistory = appendTaggedUserNote(
				getEffectiveNoteHistory(row),
				note,
				"booking",
			);

			await saveOrderMutation.mutateAsync({
				id: row.id,
				updates: {
					bookingDate: date,
					bookingNote: note,
					noteHistory: newNoteHistory,
					...(status ? { bookingStatus: status } : {}),
				},
				stage: "booking",
				sourceStage: "orders",
			});
		}

		setSelectedRows([]);
		toast.success(`${selectedRows.length} order(s) sent to Booking`);
	};

	const handleUpdatePartStatus = async (status: string) => {
		if (selectedRows.length === 0) return;

		// 1. Apply patch commands for all status changes
		for (const row of selectedRows) {
			applyCommand({
				type: "patchRow",
				id: row.id,
				sourceStage: "orders",
				destinationStage: "orders",
				updates: { partStatus: status },
				previousValues: { partStatus: row.partStatus },
			});
		}

		// 2. Check each unique VIN for auto-move to Call List
		const uniqueVins = [
			...new Set(selectedRows.map((r) => r.vin).filter(Boolean)),
		];

		for (const vin of uniqueVins) {
			const editedRow = selectedRows.find((r) => r.vin === vin);
			if (!editedRow) continue;

			const vinIds = getVinAutoMoveIds({
				stage: "orders",
				stageRows: effectiveOrdersData,
				editedRowId: editedRow.id,
				editedVin: vin,
				nextPartStatus: status,
			});

			if (vinIds.length > 0) {
				applyCommand({
					type: "moveRows",
					ids: vinIds,
					sourceStage: "orders",
					destinationStage: "call",
				});
				toast.success(`All parts for VIN ${vin} arrived! Moved to Call List.`, {
					duration: 5000,
				});
			}
		}

		toast.success(`Part status updated to "${status}"`);
	};

	const handleSaveBulkAttachment = async ({
		attachmentLink,
	}: {
		attachmentLink?: string;
	}) => {
		if (selectedRows.length === 0) return;
		const sanitizedLink = attachmentLink
			? sanitizeAttachmentLink(attachmentLink)
			: undefined;

		await Promise.all(
			selectedRows.map((row) =>
				handleUpdateOrder(row.id, {
					attachmentLink: sanitizedLink,
					hasAttachment: hasAttachment({
						attachmentLink: sanitizedLink,
						attachmentFilePath: row.attachmentFilePath,
					}),
				}),
			),
		);

		if (sanitizedLink) {
			toast.success("Bulk attachment link updated");
		} else {
			toast.success("Bulk attachment link cleared");
		}
		setIsBulkAttachmentModalOpen(false);
	};

	const handlePrint = () => {
		if (selectedRows.length === 0) return;
		printOrderDocument(selectedRows);
	};

	const handleReserve = () => {
		const reservedRows = filterReservedRows(selectedRows, partStatuses);
		if (reservedRows.length === 0) return;
		printReservationLabels(reservedRows);
	};

	const handleShareToLogistics = () => {
		if (selectedRows.length === 0) return;
		exportToLogisticsCSV(selectedRows);
	};

	const handleSendToCallList = async () => {
		if (selectedRows.length === 0) return;

		// Part number + description required before sending to call list
		const rowsMissingParts = selectedRows.filter(
			(row) => !row.partNumber?.trim() || !row.description?.trim(),
		);
		if (rowsMissingParts.length > 0) {
			toast.error(
				`${rowsMissingParts.length} order(s) missing part number or description. Complete all part fields before sending to Call List.`,
			);
			return;
		}

		const ids = getSelectedIds(selectedRows);
		applyCommand({
			type: "moveRows",
			ids,
			sourceStage: "orders",
			destinationStage: "call",
		});
		setSelectedRows([]);
		toast.success(`${selectedRows.length} order(s) sent to Call List`);
	};

	const handleDeleteSelected = async () => {
		const ids = getSelectedIds(selectedRows);
		applyCommand({
			type: "deleteRows",
			ids,
		});
		setSelectedRows([]);
		toast.success("Order(s) deleted");
		setShowDeleteConfirm(false);
	};

	return {
		// Data
		ordersRowData: effectiveOrdersData,

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

		// Draft session
		applyCommand,
		draftSaving,
	};
};
