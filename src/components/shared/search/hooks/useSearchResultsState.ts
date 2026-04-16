"use client";

import type {
	CellValueChangedEvent,
	GridApi,
	SelectionChangedEvent,
} from "ag-grid-community";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	getGlobalSearchWorkspaceColumns,
	type SearchHeaderCheckboxState,
} from "@/components/shared/GridConfig";
import {
	buildGlobalSearchString,
	getMissingPartRows,
} from "@/components/shared/search/searchUtils";
import {
	useBulkDeleteOrdersMutation,
	useBulkUpdateOrderStageMutation,
	useOrdersQuery,
	useSaveOrderMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useRowModals } from "@/hooks/useRowModals";
import { exportToLogisticsXLSX } from "@/lib/exportUtils";
import { normalizeOrderStage } from "@/lib/orderStage";
import {
	appendTaggedUserNote,
	filterReservedRows,
	getEffectiveNoteHistory,
	getVinAutoMoveIds,
} from "@/lib/orderWorkflow";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import type { OrderStage } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export const useSearchResultsState = () => {
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const partStatuses = useAppStore((state) => state.partStatuses);

	// Grid & Selection State
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [_masterCheckboxState, setMasterCheckboxState] =
		useState<SearchHeaderCheckboxState>(false);
	const masterCheckboxStateRef = useRef<SearchHeaderCheckboxState>(false);
	const [showFilters, setShowFilters] = useState(false);
	const [activeSources, _setActiveSources] = useState<string[]>([]);
	const gridApiRef = useRef<GridApi<PendingRow> | null>(null);

	// Toolbar State Logic
	const selectedStages = useMemo(
		() => [...new Set(selectedRows.map((r) => r.stage))],
		[selectedRows],
	);
	const isSameSource = selectedStages.length <= 1;
	const disabledReason = isSameSource ? "" : "Mixed sources selected";
	const activeStage = selectedStages[0];

	// Modal State
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [showArchiveModal, setShowArchiveModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showReorderModal, setShowReorderModal] = useState(false);
	const [reorderReason, setReorderReason] = useState("");

	// Fetch data from all sources
	const { data: mainData = [] } = useOrdersQuery("main");
	const { data: ordersData = [] } = useOrdersQuery("orders");
	const { data: bookingData = [] } = useOrdersQuery("booking");
	const { data: callData = [] } = useOrdersQuery("call");
	const { data: archiveData = [] } = useOrdersQuery("archive");

	const saveOrderMutation = useSaveOrderMutation();
	const normalizedActiveStage = normalizeOrderStage(activeStage);
	const deleteOrdersMutation = useBulkDeleteOrdersMutation(
		normalizedActiveStage ?? "main",
	);

	// Bulk stage update mutations
	const bulkStageMutationsRaw = {
		main: useBulkUpdateOrderStageMutation("main"),
		orders: useBulkUpdateOrderStageMutation("orders"),
		booking: useBulkUpdateOrderStageMutation("booking"),
		call: useBulkUpdateOrderStageMutation("call"),
		archive: useBulkUpdateOrderStageMutation("archive"),
	};

	const bulkStageMutations = useMemo(
		() => bulkStageMutationsRaw,
		[
			bulkStageMutationsRaw.main,
			bulkStageMutationsRaw.orders,
			bulkStageMutationsRaw.booking,
			bulkStageMutationsRaw.call,
			bulkStageMutationsRaw.archive,
		],
	);

	// Combine all rows with sourceType
	const searchResults = useMemo(() => {
		if (!searchTerm || searchTerm.trim().length === 0) return [];

		const terms = searchTerm
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		if (terms.length === 0) return [];

		const all = [
			...mainData.map((r) => ({
				...r,
				sourceType: "Main Sheet",
				stage: "main" as OrderStage,
			})),
			...ordersData.map((r) => ({
				...r,
				sourceType: "Orders",
				stage: "orders" as OrderStage,
			})),
			...bookingData.map((r) => ({
				...r,
				sourceType: "Booking",
				stage: "booking" as OrderStage,
			})),
			...callData.map((r) => ({
				...r,
				sourceType: "Call",
				stage: "call" as OrderStage,
			})),
			...archiveData.map((r) => ({
				...r,
				sourceType: "Archive",
				stage: "archive" as OrderStage,
			})),
		];

		const found = all.filter((row) => {
			const searchString = buildGlobalSearchString(row);
			return terms.every((term) => searchString.includes(term));
		});

		if (activeSources.length === 0) return found;
		return found.filter((row) => activeSources.includes(row.sourceType));
	}, [
		searchTerm,
		mainData,
		ordersData,
		bookingData,
		callData,
		archiveData,
		activeSources,
	]);

	// Handlers
	const syncMasterCheckboxState = useCallback((api: GridApi<PendingRow>) => {
		let selectableCount = 0;
		let selectedCount = 0;

		api.forEachNodeAfterFilter((node) => {
			if (node.group || !node.selectable) return;
			selectableCount += 1;
			if (node.isSelected()) {
				selectedCount += 1;
			}
		});

		if (selectableCount === 0 || selectedCount === 0) {
			if (masterCheckboxStateRef.current !== false) {
				masterCheckboxStateRef.current = false;
				setMasterCheckboxState(false);
				api.refreshHeader();
			}
			return;
		}

		if (selectedCount === selectableCount) {
			if (masterCheckboxStateRef.current !== true) {
				masterCheckboxStateRef.current = true;
				setMasterCheckboxState(true);
				api.refreshHeader();
			}
			return;
		}

		if (masterCheckboxStateRef.current !== "indeterminate") {
			masterCheckboxStateRef.current = "indeterminate";
			setMasterCheckboxState("indeterminate");
			api.refreshHeader();
		}
	}, []);

	const handleSelectionChanged = useCallback(
		(params: SelectionChangedEvent<PendingRow>) => {
			setSelectedRows(params.api.getSelectedRows());
			syncMasterCheckboxState(params.api);
		},
		[syncMasterCheckboxState],
	);

	const handleGridApiReady = useCallback((api: GridApi<PendingRow>) => {
		gridApiRef.current = api;
	}, []);

	const handleDisplayedRowsChanged = useCallback(
		(api: GridApi<PendingRow>) => {
			const displayedIds = new Set<string>();
			api.forEachNodeAfterFilter((node) => {
				if (!node.group && node.data?.id) displayedIds.add(node.data.id);
			});

			api.forEachNode((node) => {
				if (node.data && !displayedIds.has(node.data.id) && node.isSelected()) {
					node.setSelected(false);
				}
			});

			setSelectedRows(api.getSelectedRows());
			syncMasterCheckboxState(api);
		},
		[syncMasterCheckboxState],
	);

	const handleGridPreDestroyed = useCallback(() => {
		gridApiRef.current = null;
		masterCheckboxStateRef.current = false;
		setMasterCheckboxState(false);
		setSelectedRows([]);
	}, []);

	const handleSelectAllFiltered = useCallback((selected: boolean) => {
		const api = gridApiRef.current;
		if (!api) return;

		if (selected) {
			api.selectAllFiltered();
			return;
		}

		api.deselectAllFiltered();
	}, []);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>, stage?: string) => {
			const normalizedStage = normalizeOrderStage(stage);
			const fallbackStage = normalizedActiveStage ?? "main";
			const resolvedStage: OrderStage = normalizedStage ?? fallbackStage;

			if (stage?.trim() && !normalizedStage) {
				console.error("[SearchResultsView] invalid_stage_fallback", {
					rowId: id,
					rawStage: stage,
					fallbackStage: resolvedStage,
				});
			}

			return saveOrderMutation.mutateAsync({
				id,
				updates,
				stage: resolvedStage,
				sourceStage: resolvedStage,
			});
		},
		[normalizedActiveStage, saveOrderMutation],
	);

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
		saveArchive,
		sourceTag,
	} = useRowModals(handleUpdateOrder);

	const stableOnNoteClick = useCallback(
		(row: PendingRow) => handleNoteClick(row, row.sourceType as string),
		[handleNoteClick],
	);
	const stableOnAttachClick = useCallback(
		(row: PendingRow) => handleAttachClick(row, row.sourceType as string),
		[handleAttachClick],
	);

	const columns = useMemo(() => {
		return getGlobalSearchWorkspaceColumns(
			partStatuses,
			stableOnNoteClick,
			handleReminderClick,
			stableOnAttachClick,
			masterCheckboxStateRef,
			handleSelectAllFiltered,
		);
	}, [
		partStatuses,
		stableOnNoteClick,
		handleReminderClick,
		stableOnAttachClick,
		handleSelectAllFiltered,
	]);

	// Toolbar Actions
	const handleReserve = useCallback(() => {
		const reservedRows = filterReservedRows(selectedRows, partStatuses);
		if (reservedRows.length === 0) return;
		printReservationLabels(reservedRows);
	}, [selectedRows, partStatuses]);

	const handleBookingConfirm = useCallback(
		async (date: string, note: string, status?: string) => {
			if (selectedRows.length === 0 || !isSameSource) return;

			if (activeStage === "orders") {
				const missing = getMissingPartRows(selectedRows);
				if (missing.length > 0) {
					toast.error(
						`${missing.length} order(s) missing part number or description. Complete all part fields before booking.`,
					);
					return;
				}
			}

			try {
				await Promise.all(
					selectedRows.map((row) => {
						const freshRow = searchResults.find((r) => r.id === row.id) ?? row;
						return saveOrderMutation.mutateAsync({
							id: row.id,
							updates: {
								bookingDate: date,
								bookingNote: note,
								noteHistory: appendTaggedUserNote(
									getEffectiveNoteHistory(freshRow),
									note,
									"booking",
								),
								...(status ? { bookingStatus: status } : {}),
							},
							stage: "booking",
							sourceStage: row.stage as OrderStage,
						});
					}),
				);
				toast.success(`Booked ${selectedRows.length} rows for ${date}`);
				setShowBookingModal(false);
			} catch (_error) {
				toast.error("Booking failed");
			}
		},
		[selectedRows, isSameSource, activeStage, searchResults, saveOrderMutation],
	);

	const handleArchiveConfirm = useCallback(
		async (reason: string) => {
			if (selectedRows.length === 0 || !isSameSource) return;
			try {
				await Promise.all(
					selectedRows.map((row) => {
						const freshRow = searchResults.find((r) => r.id === row.id) ?? row;
						const updatedHistory = appendTaggedUserNote(
							getEffectiveNoteHistory(freshRow),
							reason,
							"archive",
						);
						return saveOrderMutation.mutateAsync({
							id: row.id,
							updates: {
								archiveReason: reason,
								noteHistory: updatedHistory,
							},
							stage: "archive",
							sourceStage: row.stage as OrderStage,
						});
					}),
				);
				toast.success(`Archived ${selectedRows.length} rows`);
				setShowArchiveModal(false);
			} catch (_error) {
				toast.error("Archiving failed");
			}
		},
		[selectedRows, isSameSource, searchResults, saveOrderMutation],
	);

	const handleSendToCallList = useCallback(async () => {
		if (selectedRows.length === 0 || !isSameSource) return;

		if (activeStage === "orders") {
			const missing = getMissingPartRows(selectedRows);
			if (missing.length > 0) {
				toast.error(
					`${missing.length} order(s) missing part number or description. Complete all part fields before sending to Call List.`,
				);
				return;
			}
		}

		const mutation =
			bulkStageMutations[activeStage as keyof typeof bulkStageMutations];
		if (!mutation) return;

		try {
			await mutation.mutateAsync({
				ids: selectedRows.map((r) => r.id),
				stage: "call",
			});
			toast.success(`Moved ${selectedRows.length} rows to Call List`);
		} catch (_error) {
			toast.error("Move failed");
		}
	}, [selectedRows, isSameSource, activeStage, bulkStageMutations]);

	const handleReorderConfirm = useCallback(async () => {
		if (selectedRows.length === 0 || !isSameSource || !reorderReason.trim())
			return;
		try {
			const results = await Promise.allSettled(
				selectedRows.map((row) => {
					const freshRow = searchResults.find((r) => r.id === row.id) ?? row;
					return saveOrderMutation.mutateAsync({
						id: row.id,
						updates: {
							status: "Reorder",
							noteHistory: appendTaggedUserNote(
								getEffectiveNoteHistory(freshRow),
								`Reorder Reason: ${reorderReason}`,
								"reorder",
							),
						},
						stage: "orders",
						sourceStage: row.stage as OrderStage,
					});
				}),
			);

			const succeeded = results.filter(
				(r) => r.status === "fulfilled" && r.value !== null,
			);
			const skipped = results.filter(
				(r) => r.status === "fulfilled" && r.value === null,
			);
			const failed = results.filter((r) => r.status === "rejected");

			if (succeeded.length > 0) {
				setShowReorderModal(false);
				setReorderReason("");
				if (skipped.length === 0 && failed.length === 0) {
					setSelectedRows([]);
					toast.success(
						`${succeeded.length} row(s) sent back to Orders (Reorder)`,
					);
				} else {
					// Keep unresolved rows selected so the user can retry
					const succeededIds = new Set(
						selectedRows
							.filter(
								(_, i) =>
									results[i]?.status === "fulfilled" &&
									(results[i] as PromiseFulfilledResult<unknown>).value !==
										null,
							)
							.map((r) => r.id),
					);
					setSelectedRows((prev) =>
						prev.filter((r) => !succeededIds.has(r.id)),
					);
					toast.warning(
						`${succeeded.length} reordered, ${skipped.length + failed.length} could not be moved (already moved or failed). Remaining rows stay selected.`,
					);
				}
			} else if (skipped.length > 0 && failed.length === 0) {
				toast.warning(
					"No rows were moved — they may have already been reordered by another session.",
				);
			} else {
				toast.error("Reorder failed");
			}
		} catch (_error) {
			toast.error("Reorder failed");
		}
	}, [
		selectedRows,
		isSameSource,
		reorderReason,
		searchResults,
		saveOrderMutation,
	]);

	const handleDeleteConfirm = useCallback(async () => {
		if (selectedRows.length === 0 || !isSameSource) return;
		try {
			await deleteOrdersMutation.mutateAsync(selectedRows.map((r) => r.id));
			toast.success(`Deleted ${selectedRows.length} rows`);
			setSelectedRows([]);
		} catch (_error) {
			toast.error("Delete failed");
		}
	}, [selectedRows, isSameSource, deleteOrdersMutation]);

	const handleBulkStatusUpdate = useCallback(
		async (status: string) => {
			if (selectedRows.length === 0 || !isSameSource) return;
			try {
				await Promise.all(
					selectedRows.map((row) =>
						saveOrderMutation.mutateAsync({
							id: row.id,
							updates: { partStatus: status },
							stage: row.stage as OrderStage,
							sourceStage: row.stage as OrderStage,
						}),
					),
				);
				toast.success(`Updated status for ${selectedRows.length} rows`);
			} catch (_error) {
				toast.error("Status update failed");
			}
		},
		[selectedRows, isSameSource, saveOrderMutation],
	);

	const handleExtract = useCallback(() => {
		exportToLogisticsXLSX(searchResults).catch(() => {
			toast.error("Export failed");
		});
	}, [searchResults]);

	const onCellValueChanged = useCallback(
		async (event: CellValueChangedEvent<PendingRow>) => {
			if (
				event.colDef.field === "partStatus" &&
				event.data?.id &&
				event.newValue !== event.oldValue
			) {
				try {
					await handleUpdateOrder(
						event.data.id,
						{ partStatus: event.newValue },
						event.data.stage,
					);
				} catch {
					return;
				}

				const stage = event.data.stage;
				// Must use live query data here. Do not derive this from filtered search results
				// or memoize a stage map outside the edit handler.
				const stageRows =
					stage === "main" ? mainData : stage === "orders" ? ordersData : [];
				const vinIds = getVinAutoMoveIds({
					stage,
					stageRows,
					editedRowId: event.data.id,
					editedVin: event.data.vin,
					nextPartStatus: event.newValue,
				});

				if (vinIds.length === 0) {
					toast.success("Status updated");
					return;
				}

				const mutation =
					stage && stage in bulkStageMutations
						? bulkStageMutations[stage as keyof typeof bulkStageMutations]
						: undefined;

				if (!mutation) {
					toast.success("Status updated");
					return;
				}

				try {
					await mutation.mutateAsync({
						ids: vinIds,
						stage: "call",
						silentErrorToast: true,
					});
					toast.success(
						`All parts for VIN ${event.data.vin} arrived! Moved to Call List.`,
						{ duration: 5000 },
					);
				} catch (error) {
					console.error("[SearchResultsView] vin_auto_move_failed", {
						error,
						vin: event.data.vin,
						stage,
						ids: vinIds,
					});
					toast.error(
						"Part saved, but VIN group move failed - refresh and try again.",
					);
				}
			}
		},
		[bulkStageMutations, handleUpdateOrder, mainData, ordersData],
	);

	const counts = searchResults.reduce(
		(acc, curr) => {
			const source = curr.sourceType || "Unknown";
			acc[source] = (acc[source] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return {
		searchTerm,
		setSearchTerm,
		selectedRows,
		showFilters,
		setShowFilters,
		showBookingModal,
		setShowBookingModal,
		showArchiveModal,
		setShowArchiveModal,
		showDeleteConfirm,
		setShowDeleteConfirm,
		isSameSource,
		disabledReason,
		searchResults,
		counts,
		columns,
		partStatuses,
		handleReserve,
		handleBookingConfirm,
		handleArchiveConfirm,
		handleSendToCallList,
		showReorderModal,
		setShowReorderModal,
		reorderReason,
		setReorderReason,
		handleReorderConfirm,
		handleDeleteConfirm,
		handleBulkStatusUpdate,
		handleExtract,
		onCellValueChanged,
		handleSelectionChanged,
		handleGridApiReady,
		handleDisplayedRowsChanged,
		handleGridPreDestroyed,
		handleSelectAllFiltered,
		// row modals
		activeModal,
		currentRow,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
		sourceTag,
	};
};
