"use client";

import type { GridApi } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { FreezeToolbar } from "@/components/freeze/FreezeToolbar";
import {
	UnfreezeMoveDialog,
	type UnfreezeOrigin,
} from "@/components/freeze/UnfreezeMoveDialog";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { getFreezeColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { isOrderStage } from "@/domain/order/orderStage";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useDraftSession } from "@/hooks/useDraftSession";
import { useRowModals } from "@/hooks/useRowModals";
import { useSelectAllByVin } from "@/hooks/useSelectAllByVin";
import { useSelectedRowsSync } from "@/hooks/useSelectedRowsSync";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useFreezePageActions } from "./useFreezePageActions";

export default function FreezePage() {
	const { data: freezeRowData = [] } = useOrdersQuery("freeze");

	// Draft session for undo/redo
	const {
		workingRows: draftWorkingRows,
		applyCommand,
		saving: draftSaving,
	} = useDraftSession("freeze");

	// Use draft working rows if available, fallback to query data
	const effectiveData = draftWorkingRows || freezeRowData;

	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (freezeRowData) {
			checkNotifications();
		}
	}, [freezeRowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);

	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);

	const { onSelectAllByVin, isSelectAllByVinDisabled } = useSelectAllByVin(
		selectedRows,
		gridApi,
	);

	const [showFilters, setShowFilters] = useState(false);
	const [scrollDir, setScrollDir] = useState<"vertical" | "horizontal">(
		"vertical",
	);
	const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);

	const { handleUpdateOrder, handleConfirmUnfreeze } = useFreezePageActions({
		applyCommand,
		selectedRows,
		setSelectedRows,
	});

	// Default "Move to…" destination: the first selected row's previousStage
	// (the stage it was frozen from). Falls back to "main" when no selected
	// row carries a valid previousStage (e.g. legacy frozen rows).
	const moveDefaultStage = useMemo(() => {
		for (const row of selectedRows) {
			if (isOrderStage(row.previousStage) && row.previousStage !== "freeze") {
				return row.previousStage;
			}
		}
		return "main" as const;
	}, [selectedRows]);

	// How the selection's recorded pre-freeze stage(s) should be described in
	// the "Move to…" dialog. Independent of moveDefaultStage above, which keeps
	// its own first-valid-stage-else-"main" default unchanged.
	const moveOrigin = useMemo<UnfreezeOrigin>(() => {
		const validStages = selectedRows
			.map((row) => row.previousStage)
			.filter(
				(stage): stage is Exclude<typeof stage, null | undefined> =>
					isOrderStage(stage) && stage !== "freeze",
			);
		const distinctStages = new Set(validStages);

		if (distinctStages.size === 0) return { kind: "none" };
		if (distinctStages.size > 1) return { kind: "mixed" };
		if (validStages.length === selectedRows.length) {
			return { kind: "single", stage: validStages[0] };
		}
		return { kind: "partial" };
	}, [selectedRows]);

	// Sync selectedRows with the latest effectiveData to prevent stale data
	useSelectedRowsSync("freeze", effectiveData, selectedRows, setSelectedRows);

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
	} = useRowModals(handleUpdateOrder);

	const columns = useMemo(() => {
		return getFreezeColumns(
			partStatuses,
			(row) => handleNoteClick(row, "freeze"),
			handleReminderClick,
			handleAttachClick,
		);
	}, [partStatuses, handleNoteClick, handleReminderClick, handleAttachClick]);

	return (
		<div className="space-y-4 h-full flex flex-col">
			<InfoLabel data={selectedRows[0] || null} />

			<FreezeToolbar
				selectedRows={selectedRows}
				rowData={effectiveData}
				onExtract={() => gridApi?.exportDataAsCsv()}
				onFilterToggle={() => setShowFilters(!showFilters)}
				onSelectAllByVin={onSelectAllByVin}
				isSelectAllByVinDisabled={isSelectAllByVinDisabled}
				onMoveTo={() => setMoveDialogOpen(true)}
			/>

			{/* biome-ignore lint/a11y/noStaticElementInteractions: outer wrapper captures contextmenu events; AG Grid owns all real a11y/focus management */}
			<div
				role="presentation"
				className={`flex-1 min-h-[500px] border border-white/10 rounded-xl mt-4 ${
					scrollDir === "horizontal"
						? "overflow-x-auto overflow-y-hidden"
						: "overflow-hidden"
				}`}
				onContextMenu={(e) => {
					e.preventDefault();
					setScrollDir((d) => (d === "vertical" ? "horizontal" : "vertical"));
				}}
			>
				<DataGrid
					rowData={effectiveData}
					columnDefs={columns}
					gridStateKey="freeze"
					stage="freeze"
					readOnly={!gridEditPermission || draftSaving}
					onSelectionChange={setSelectedRows}
					onCellValueChanged={async (params) => {
						if (
							params.colDef.field === "rDate" &&
							params.newValue !== params.oldValue
						) {
							const v = params.newValue as string;
							if (!v?.trim() || Number.isNaN(Date.parse(v))) return;
							await handleUpdateOrder(params.data.id, { rDate: v });
						} else if (
							params.colDef.field &&
							params.colDef.field !== "rDate" &&
							params.colDef.field !== "status" &&
							params.newValue !== params.oldValue
						) {
							await handleUpdateOrder(params.data.id, {
								[params.colDef.field]: params.newValue,
							});
						}
					}}
					onGridReady={(api) => setGridApi(api)}
					showFloatingFilters={showFilters}
					enablePagination={true}
					pageSize={20}
				/>
			</div>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={() => {}}
				sourceTag="freeze"
			/>

			<UnfreezeMoveDialog
				open={isMoveDialogOpen}
				onOpenChange={setMoveDialogOpen}
				initialStage={moveDefaultStage}
				rowCount={selectedRows.length}
				origin={moveOrigin}
				onCancel={() => setMoveDialogOpen(false)}
				onConfirm={(destinationStage) => {
					handleConfirmUnfreeze(destinationStage);
					setMoveDialogOpen(false);
				}}
			/>
		</div>
	);
}
