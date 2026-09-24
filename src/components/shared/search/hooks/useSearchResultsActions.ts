"use client";

import type { CellValueChangedEvent } from "ag-grid-community";
import type { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { getMissingPartRows } from "@/components/shared/search/searchUtils";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	appendTaggedUserNote,
	filterReservedRows,
	getEffectiveNoteHistory,
	getVinAutoMoveIds,
} from "@/domain/order/orderWorkflow";
import type { useBulkDeleteOrdersMutation } from "@/hooks/queries/useBulkDeleteOrdersMutation";
import type { useBulkUpdateOrderStageMutation } from "@/hooks/queries/useBulkUpdateOrderStageMutation";
import type { useSaveOrderMutation } from "@/hooks/queries/useSaveOrderMutation";
import type { ReleaseGateApi } from "@/hooks/useReleaseGate";
import { useT } from "@/hooks/useT";
import { exportToLogisticsXLSX } from "@/lib/exportUtils";
import { logger } from "@/lib/logger";
import {
	buildMoveToMainUpdates,
	buildReorderUpdates,
	getMoveToMainSourceStage,
} from "@/lib/orderStageTransitions";
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import type { UIActions } from "@/store/types";
import type { PartStatus, PendingRow } from "@/types";

export interface UseSearchResultsActionsArgs {
	selectedRows: PendingRow[];
	setSelectedRows: React.Dispatch<React.SetStateAction<PendingRow[]>>;
	isSameSource: boolean;
	activeStage: OrderStage | undefined;
	searchResults: PendingRow[];
	filteredResults: PendingRow[];
	mainData: PendingRow[];
	ordersData: PendingRow[];
	freezeData: PendingRow[];
	partStatuses: PartStatus[];
	saveOrderMutation: ReturnType<typeof useSaveOrderMutation>;
	bulkStageMutations: Record<
		OrderStage,
		ReturnType<typeof useBulkUpdateOrderStageMutation>
	>;
	deleteOrdersMutation: ReturnType<typeof useBulkDeleteOrdersMutation>;
	requestCallRelease: ReleaseGateApi["requestCallRelease"];
	clearFollowUpsForVins: ReleaseGateApi["clearFollowUpsForVins"];
	handleUpdateOrder: (
		id: string,
		updates: Partial<PendingRow>,
		stage?: string,
	) => Promise<unknown>;
	setPendingSearchSelection: UIActions["setPendingSearchSelection"];
	setSearchTerm: UIActions["setSearchTerm"];
	router: ReturnType<typeof useRouter>;
	setShowBookingModal: React.Dispatch<React.SetStateAction<boolean>>;
	setShowArchiveModal: React.Dispatch<React.SetStateAction<boolean>>;
	setShowReorderModal: React.Dispatch<React.SetStateAction<boolean>>;
	reorderReason: string;
	setReorderReason: React.Dispatch<React.SetStateAction<string>>;
	moveToMainPermission: boolean;
	setShowMoveToMainModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SOURCE_TO_STAGE: Record<string, string> = {
	"Main Sheet": "main",
	Orders: "orders",
	Booking: "booking",
	Call: "call",
	Archive: "archive",
	Freeze: "freeze",
};

const SOURCE_TO_ROUTE: Record<string, string> = {
	"Main Sheet": "/main-sheet",
	Orders: "/orders",
	Booking: "/booking",
	Call: "/call-list",
	Archive: "/archive",
	Freeze: "/freeze",
};

// Toolbar + grid-edit actions for the Global Search results grid: booking,
// archiving, sending to Call List (with the release gate), reorder,
// bulk delete/status-update, export, badge navigation, and the inline
// status-cell edit with its VIN auto-move follow-through.
export const useSearchResultsActions = ({
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
	moveToMainPermission,
	setShowMoveToMainModal,
}: UseSearchResultsActionsArgs) => {
	const { t } = useT();
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
				const results = await Promise.allSettled(
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

				const succeededIds = new Set(
					selectedRows
						.filter((_, i) => results[i]?.status === "fulfilled")
						.map((r) => r.id),
				);
				const failedCount = selectedRows.length - succeededIds.size;

				if (succeededIds.size > 0) {
					setShowBookingModal(false);
					if (failedCount === 0) {
						setSelectedRows([]);
						toast.success(`Booked ${selectedRows.length} rows for ${date}`);
					} else {
						setSelectedRows((prev) =>
							prev.filter((r) => !succeededIds.has(r.id)),
						);
						toast.warning(
							`${succeededIds.size} row(s) booked, ${failedCount} failed (possibly edited elsewhere). Remaining rows stay selected.`,
						);
					}
				} else {
					toast.error("Booking failed");
				}
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
				const results = await Promise.allSettled(
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

				const succeededIds = new Set(
					selectedRows
						.filter((_, i) => results[i]?.status === "fulfilled")
						.map((r) => r.id),
				);
				const failedCount = selectedRows.length - succeededIds.size;

				if (succeededIds.size > 0) {
					setShowArchiveModal(false);
					if (failedCount === 0) {
						setSelectedRows([]);
						toast.success(`Archived ${selectedRows.length} rows`);
					} else {
						setSelectedRows((prev) =>
							prev.filter((r) => !succeededIds.has(r.id)),
						);
						toast.warning(
							`${succeededIds.size} row(s) archived, ${failedCount} failed (possibly edited elsewhere). Remaining rows stay selected.`,
						);
					}
				} else {
					toast.error("Archiving failed");
				}
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

		const gateResult = await requestCallRelease({
			rows: selectedRows,
			automatic: false,
		});
		if (gateResult.approvedRows.length === 0) {
			if (gateResult.cancelledVins.length > 0) {
				toast.error("Release not confirmed — no rows were moved.");
			}
			return;
		}

		try {
			await mutation.mutateAsync({
				ids: gateResult.approvedRows.map((r) => r.id),
				stage: "call",
			});
			await clearFollowUpsForVins(gateResult.approvedVins);
			toast.success(
				`Moved ${gateResult.approvedRows.length} rows to Call List${
					gateResult.cancelledVins.length > 0
						? ` (${gateResult.cancelledVins.length} chassis withheld pending release approval)`
						: ""
				}`,
			);
		} catch (_error) {
			toast.error("Move failed");
		}
	}, [
		selectedRows,
		isSameSource,
		activeStage,
		bulkStageMutations,
		requestCallRelease,
		clearFollowUpsForVins,
	]);

	const handleReorderConfirm = useCallback(async () => {
		if (selectedRows.length === 0 || !isSameSource || !reorderReason.trim())
			return;
		try {
			const results = await Promise.allSettled(
				selectedRows.map((row) => {
					const freshRow = searchResults.find((r) => r.id === row.id) ?? row;
					return saveOrderMutation.mutateAsync({
						id: row.id,
						updates: buildReorderUpdates(freshRow, reorderReason),
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

	const handleMoveToMainConfirm = useCallback(async () => {
		// Re-check the source stage at confirmation time: only a selection
		// entirely within one of call/booking/archive may move.
		const sourceStage = getMoveToMainSourceStage(
			selectedRows.map((row) => row.stage),
		);
		if (!sourceStage) return;

		// Re-check the Settings switch — it may have been turned off while the
		// confirmation dialog was open.
		if (!moveToMainPermission) {
			toast.error(t("modals.moveToMain.permissionOff"));
			return;
		}

		const total = selectedRows.length;
		try {
			const results = await Promise.all(
				selectedRows.map(
					async (row): Promise<"moved" | "skipped" | "failed"> => {
						const freshRow = searchResults.find((r) => r.id === row.id);
						// Stale selection: the row left the source stage (or vanished)
						// since it was selected. Never write it.
						if (!freshRow || freshRow.stage !== sourceStage) {
							return "skipped";
						}
						try {
							const saved = await saveOrderMutation.mutateAsync({
								id: row.id,
								updates: buildMoveToMainUpdates(freshRow, sourceStage),
								stage: "main",
								sourceStage,
							});
							// `null` = compare-and-set no-op: the row moved elsewhere.
							return saved === null ? "skipped" : "moved";
						} catch {
							return "failed";
						}
					},
				),
			);

			const movedIds = new Set(
				selectedRows.filter((_, i) => results[i] === "moved").map((r) => r.id),
			);
			const skipped = results.filter((r) => r === "skipped").length;
			const failed = results.filter((r) => r === "failed").length;

			if (movedIds.size === 0) {
				if (failed === 0) {
					toast.warning(t("modals.moveToMain.noneMoved"));
				} else {
					toast.error(t("modals.moveToMain.failed"));
				}
				return;
			}

			setShowMoveToMainModal(false);
			if (movedIds.size === total) {
				setSelectedRows([]);
				toast.success(t("modals.moveToMain.success", { count: total }));
				return;
			}

			// Keep unresolved rows selected so the user can review/retry.
			setSelectedRows((prev) => prev.filter((r) => !movedIds.has(r.id)));
			toast.warning(
				t("modals.moveToMain.partial", {
					moved: movedIds.size,
					total,
					skipped,
					failed,
				}),
			);
		} catch (_error) {
			toast.error(t("modals.moveToMain.failed"));
		}
	}, [
		selectedRows,
		moveToMainPermission,
		searchResults,
		saveOrderMutation,
		setSelectedRows,
		setShowMoveToMainModal,
		t,
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
				const results = await Promise.allSettled(
					selectedRows.map((row) =>
						saveOrderMutation.mutateAsync({
							id: row.id,
							updates: { status },
							stage: row.stage as OrderStage,
							sourceStage: row.stage as OrderStage,
						}),
					),
				);

				const succeededIds = new Set(
					selectedRows
						.filter((_, i) => results[i]?.status === "fulfilled")
						.map((r) => r.id),
				);
				const failedCount = selectedRows.length - succeededIds.size;

				if (succeededIds.size > 0) {
					if (failedCount === 0) {
						toast.success(`Updated status for ${selectedRows.length} rows`);
					} else {
						setSelectedRows((prev) =>
							prev.filter((r) => !succeededIds.has(r.id)),
						);
						toast.warning(
							`Updated ${succeededIds.size} row(s), ${failedCount} failed (possibly edited elsewhere). Remaining rows stay selected.`,
						);
					}
				} else {
					toast.error("Status update failed");
				}
			} catch (_error) {
				toast.error("Status update failed");
			}
		},
		[selectedRows, isSameSource, saveOrderMutation],
	);

	const handleExtract = useCallback(() => {
		exportToLogisticsXLSX(filteredResults).catch(() => {
			toast.error("Export failed");
		});
	}, [filteredResults]);

	const onBadgeNavigate = useCallback(
		(source: string) => {
			const targetIds =
				selectedRows.length > 0
					? selectedRows.filter((r) => r.sourceType === source).map((r) => r.id)
					: filteredResults
							.filter((r) => r.sourceType === source)
							.map((r) => r.id);

			const stage = SOURCE_TO_STAGE[source];
			const route = SOURCE_TO_ROUTE[source];
			if (!stage || !route || targetIds.length === 0) return;

			setPendingSearchSelection({ stage, ids: targetIds });
			setSearchTerm("");
			router.push(route);
		},
		[
			selectedRows,
			filteredResults,
			setPendingSearchSelection,
			setSearchTerm,
			router,
		],
	);

	const onCellValueChanged = useCallback(
		async (event: CellValueChangedEvent<PendingRow>) => {
			if (
				event.colDef.field === "status" &&
				event.data?.id &&
				event.newValue !== event.oldValue
			) {
				try {
					await handleUpdateOrder(
						event.data.id,
						{ status: event.newValue },
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
					nextStatus: event.newValue,
					frozenRows: freezeData,
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

				const vinRows = stageRows.filter((r) => vinIds.includes(r.id));
				const gateResult = await requestCallRelease({
					rows: vinRows,
					automatic: true,
				});
				if (gateResult.approvedRows.length === 0) {
					toast.success("Status updated");
					return;
				}

				try {
					await mutation.mutateAsync({
						ids: gateResult.approvedRows.map((r) => r.id),
						stage: "call",
						silentErrorToast: true,
						guardFrozenVins: true,
					});
					await clearFollowUpsForVins(gateResult.approvedVins);
					toast.success(
						`All parts for VIN ${event.data.vin} arrived! Moved to Call List.`,
						{ duration: 5000 },
					);
				} catch (error) {
					logger.error("[SearchResultsView] vin_auto_move_failed", {
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
		[
			bulkStageMutations,
			freezeData,
			handleUpdateOrder,
			mainData,
			ordersData,
			requestCallRelease,
			clearFollowUpsForVins,
		],
	);

	return {
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
	};
};
