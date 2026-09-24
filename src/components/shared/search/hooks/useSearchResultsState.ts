"use client";

import type { GridApi, SelectionChangedEvent } from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	getGlobalSearchWorkspaceColumns,
	type SearchHeaderCheckboxState,
} from "@/components/shared/GridConfig";
import {
	MOVE_TO_MAIN_SOURCE_STAGES,
	useSearchResultsActions,
} from "@/components/shared/search/hooks/useSearchResultsActions";
import { useSearchResultsFilterChain } from "@/components/shared/search/hooks/useSearchResultsFilterChain";
import { buildGlobalSearchString } from "@/components/shared/search/searchUtils";
import type { OrderStage } from "@/domain/order/orderStage";
import { useBulkDeleteOrdersMutation } from "@/hooks/queries/useBulkDeleteOrdersMutation";
import { useBulkUpdateOrderStageMutation } from "@/hooks/queries/useBulkUpdateOrderStageMutation";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useSaveOrderMutation } from "@/hooks/queries/useSaveOrderMutation";
import { useReleaseGate } from "@/hooks/useReleaseGate";
import { useRowModals } from "@/hooks/useRowModals";
import { logger } from "@/lib/logger";
import { normalizeOrderStage } from "@/lib/orderStage";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export const useSearchResultsState = () => {
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const setPendingSearchSelection = useAppStore(
		(state) => state.setPendingSearchSelection,
	);
	const router = useRouter();
	const partStatuses = useAppStore((state) => state.partStatuses);
	const moveToMainPermission = useAppStore(
		(state) => state.moveToMainPermission,
	);

	// Grid & Selection State
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [_masterCheckboxState, setMasterCheckboxState] =
		useState<SearchHeaderCheckboxState>(false);
	const masterCheckboxStateRef = useRef<SearchHeaderCheckboxState>(false);
	const [showFilters, setShowFilters] = useState(false);
	const gridApiRef = useRef<GridApi<PendingRow> | null>(null);

	// Toolbar State Logic
	const selectedStages = useMemo(
		() => [...new Set(selectedRows.map((r) => r.stage))],
		[selectedRows],
	);
	const isSameSource = selectedStages.length <= 1;
	const disabledReason = isSameSource ? "" : "Mixed sources selected";
	const activeStage = selectedStages[0];
	const isMoveToMainEligible =
		isSameSource &&
		!!activeStage &&
		MOVE_TO_MAIN_SOURCE_STAGES.includes(activeStage);

	// Modal State
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [showArchiveModal, setShowArchiveModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showReorderModal, setShowReorderModal] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [showMoveToMainModal, setShowMoveToMainModal] = useState(false);

	// Fetch data from all sources
	const { data: mainData = [] } = useOrdersQuery("main");
	const { data: ordersData = [] } = useOrdersQuery("orders");
	const { data: bookingData = [] } = useOrdersQuery("booking");
	const { data: callData = [] } = useOrdersQuery("call");
	const { data: archiveData = [] } = useOrdersQuery("archive");
	const { data: freezeData = [] } = useOrdersQuery("freeze");

	const saveOrderMutation = useSaveOrderMutation();
	const { requestCallRelease, clearFollowUpsForVins } = useReleaseGate();
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
		freeze: useBulkUpdateOrderStageMutation("freeze"),
	};

	const bulkStageMutations = useMemo(
		() => bulkStageMutationsRaw,
		[
			bulkStageMutationsRaw.main,
			bulkStageMutationsRaw.orders,
			bulkStageMutationsRaw.booking,
			bulkStageMutationsRaw.call,
			bulkStageMutationsRaw.archive,
			bulkStageMutationsRaw.freeze,
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
			...freezeData.map((r) => ({
				...r,
				sourceType: "Freeze",
				stage: "freeze" as OrderStage,
			})),
		];

		return all.filter((row) => {
			const searchString = buildGlobalSearchString(row);
			return terms.every((term) => searchString.includes(term));
		});
	}, [
		searchTerm,
		mainData,
		ordersData,
		bookingData,
		callData,
		archiveData,
		freezeData,
	]);

	const {
		sourceOptions,
		activeSourceFilter,
		handleSourceFilterChange,
		availableCompanies,
		selectedCompanies,
		handleCompanyFilterChange,
		handleCompanyFilterClear,
		modelOptions,
		selectedModels,
		setSelectedModels,
		filteredResults,
	} = useSearchResultsFilterChain(searchResults);

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
				logger.error("[SearchResultsView] invalid_stage_fallback", {
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

	const {
		handleReserve,
		handleBookingConfirm,
		handleArchiveConfirm,
		handleSendToCallList,
		handleReorderConfirm,
		handleMoveToMainConfirm,
		handleDeleteConfirm,
		handleBulkStatusUpdate,
		handleExtract,
		onBadgeNavigate,
		onCellValueChanged,
	} = useSearchResultsActions({
		selectedRows,
		setSelectedRows,
		isSameSource,
		activeStage,
		searchResults,
		filteredResults,
		mainData,
		ordersData,
		freezeData,
		partStatuses,
		saveOrderMutation,
		bulkStageMutations,
		deleteOrdersMutation,
		requestCallRelease,
		clearFollowUpsForVins,
		handleUpdateOrder,
		setPendingSearchSelection,
		setSearchTerm,
		router,
		setShowBookingModal,
		setShowArchiveModal,
		setShowReorderModal,
		reorderReason,
		setReorderReason,
		isMoveToMainEligible,
		moveToMainPermission,
		setShowMoveToMainModal,
	});

	const counts = useMemo(() => {
		if (selectedRows.length === 0) {
			return filteredResults.reduce(
				(acc, row) => {
					const source = row.sourceType || "Unknown";
					acc[source] = (acc[source] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);
		}

		// Seed every source present in filteredResults with 0, then accumulate
		// only from selectedRows. This ensures sources with 0 selected rows
		// still appear in the map so their badge renders as "0" and is disabled.
		const base = filteredResults.reduce(
			(acc, row) => {
				const source = row.sourceType || "Unknown";
				acc[source] = 0;
				return acc;
			},
			{} as Record<string, number>,
		);

		return selectedRows.reduce((acc, row) => {
			const source = row.sourceType || "Unknown";
			if (source in acc) acc[source] += 1;
			return acc;
		}, base);
	}, [filteredResults, selectedRows]);

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
		filteredResults,
		sourceOptions,
		activeSourceFilter,
		handleSourceFilterChange,
		availableCompanies,
		selectedCompanies,
		handleCompanyFilterChange,
		handleCompanyFilterClear,
		modelOptions,
		selectedModels,
		setSelectedModels,
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
		moveToMainPermission,
		isMoveToMainEligible,
		showMoveToMainModal,
		setShowMoveToMainModal,
		handleMoveToMainConfirm,
		handleDeleteConfirm,
		handleBulkStatusUpdate,
		handleExtract,
		onBadgeNavigate,
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
