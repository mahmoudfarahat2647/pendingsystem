"use client";

import type { GridApi, ValueFormatterParams } from "ag-grid-community";
import { format } from "date-fns";
import { CheckCircle, Download, Filter, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { LayoutSaveButton } from "@/components/shared/LayoutSaveButton";
import { RowModals } from "@/components/shared/RowModals";
import { VINLineCounter } from "@/components/shared/VINLineCounter";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	useBulkUpdateOrderStageMutation,
	useDeleteOrderMutation,
	useOrdersQuery,
	useSaveOrderMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useColumnLayoutTracker } from "@/hooks/useColumnLayoutTracker";
import { useRowModals } from "@/hooks/useRowModals";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function ArchivePage() {
	const { isDirty, saveLayout, saveAsDefault, resetLayout } =
		useColumnLayoutTracker("archive");
	const { data: archiveRowData = [] } = useOrdersQuery("archive");
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const saveOrderMutation = useSaveOrderMutation();

	const partStatuses = useAppStore((state) => state.partStatuses);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			return saveOrderMutation.mutateAsync({ id, updates, stage: "archive" });
		},
		[saveOrderMutation],
	);

	const handleSendToArchive = useCallback(
		(ids: string[], reason: string) => {
			for (const id of ids) {
				const row = archiveRowData.find((r: any) => r.id === id);
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
		[saveOrderMutation, archiveRowData],
	);
	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

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
	} = useRowModals(handleUpdateOrder, handleSendToArchive);

	const handleConfirmReorder = async () => {
		if (!reorderReason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		const ids = selectedRows.map((r) => r.id);
		// 1. Move stage (bulk)
		await bulkUpdateStageMutation.mutateAsync({ ids, stage: "orders" });

		// 2. Update status/note (sequential but optimistic)
		for (const row of selectedRows) {
			let newActionNote = row.actionNote || "";
			const taggedNote = `Reorder Reason: ${reorderReason} #reorder`;
			newActionNote = newActionNote
				? `${newActionNote}\n${taggedNote}`
				: taggedNote;

			await saveOrderMutation.mutateAsync({
				id: row.id,
				updates: {
					actionNote: newActionNote,
					status: "Reorder",
				},
				stage: "orders",
			});
		}
		setSelectedRows([]);
		setIsReorderModalOpen(false);
		setReorderReason("");
		toast.success(
			`${selectedRows.length} row(s) sent back to Orders (Reorder)`,
		);
	};

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			handleUpdateOrder(row.id, { partStatus: status });
		});
		toast.success(`Updated ${selectedRows.length} item(s) to ${status}`);
	};

	const columns = useMemo(() => {
		const baseColumns = getBaseColumns(
			(row) => handleNoteClick(row, "archive"),
			handleReminderClick,
			handleAttachClick,
		);
		return [
			...baseColumns.slice(0, 3),
			{
				headerName: "BOOKING",
				field: "bookingDate",
				width: 120,
				valueFormatter: (params: ValueFormatterParams<PendingRow>) => {
					if (!params.value) return "";
					try {
						return format(new Date(params.value), "EEE, MMM d, yyyy");
					} catch {
						return params.value;
					}
				},
			},
			...baseColumns.slice(3),
		];
	}, [handleNoteClick, handleReminderClick, handleAttachClick]);

	return (
		<TooltipProvider>
			<div className="space-y-4 h-full flex flex-col">
				<InfoLabel data={selectedRows[0] || null} />

				<div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
					<div className="flex items-center gap-1.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
									onClick={() => gridApi?.exportDataAsCsv()}
								>
									<Download className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Extract</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-gray-400 hover:text-white h-8 w-8"
									onClick={() => setShowFilters(!showFilters)}
								>
									<Filter className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Filter</TooltipContent>
						</Tooltip>

						<LayoutSaveButton
							isDirty={isDirty}
							onSave={saveLayout}
							onSaveAsDefault={saveAsDefault}
							onReset={resetLayout}
						/>

						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="text-gray-400 hover:text-white h-8 w-8"
											disabled={selectedRows.length === 0}
										>
											<CheckCircle className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]"
									>
										{partStatuses?.map((status) => {
											const isHex =
												status.color?.startsWith("#") ||
												status.color?.startsWith("rgb");
											const dotStyle = isHex
												? { backgroundColor: status.color }
												: undefined;
											const colorClass = isHex ? "" : status.color;

											return (
												<DropdownMenuItem
													key={status.id}
													onClick={() => handleUpdatePartStatus(status.label)}
													className="flex items-center gap-2 focus:bg-white/5 cursor-pointer"
												>
													<div
														className={cn("w-2 h-2 rounded-full", colorClass)}
														style={dotStyle}
													/>
													<span className="text-xs">{status.label}</span>
												</DropdownMenuItem>
											);
										})}
									</DropdownMenuContent>
								</DropdownMenu>
							</TooltipTrigger>
							<TooltipContent>Update Part Status</TooltipContent>
						</Tooltip>

						<div className="w-px h-5 bg-white/10 mx-1" />

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-orange-500/80 hover:text-orange-500 h-8 w-8"
									onClick={() => setIsReorderModalOpen(true)}
									disabled={selectedRows.length === 0}
								>
									<RotateCcw className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Reorder</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex items-center gap-1.5">
						<VINLineCounter rows={archiveRowData} />
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
									onClick={() => setShowDeleteConfirm(true)}
									disabled={selectedRows.length === 0}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden mt-4">
					<DataGrid
						rowData={archiveRowData}
						columnDefs={columns}
						gridStateKey="archive"
						onSelectionChange={setSelectedRows}
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
					sourceTag="archive"
				/>

				{/* Reorder Reason Modal */}
				<Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
					<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
						<DialogHeader>
							<DialogTitle className="text-orange-500">
								Reorder - Reason Required
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label>Reason for Reorder</Label>
								<Input
									value={reorderReason}
									onChange={(e) => setReorderReason(e.target.value)}
									placeholder="e.g., Customer called back, error in archive"
									className="bg-white/5 border-white/10 text-white"
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								This will send the selected items back to the Orders view.
							</p>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsReorderModalOpen(false)}
								className="border-white/20 text-white hover:bg-white/10"
							>
								Cancel
							</Button>
							<Button
								variant="renault"
								onClick={handleConfirmReorder}
								disabled={!reorderReason.trim()}
							>
								Confirm Reorder
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<ConfirmDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
					onConfirm={async () => {
						for (const row of selectedRows) {
							await deleteOrderMutation.mutateAsync(row.id);
						}
						setSelectedRows([]);
						toast.success("Archived record(s) deleted");
						setShowDeleteConfirm(false);
					}}
					title="Delete Archived Records"
					description={`Are you sure you want to permanently delete ${selectedRows.length} selected record(s)?`}
					confirmText="Permanently Delete"
				/>
			</div>
		</TooltipProvider>
	);
}
