"use client";

import type { GridApi } from "ag-grid-community";
import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	History as HistoryIcon,
	RotateCcw,
	Tag,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DynamicDataGrid as DataGrid } from "@/components/grid";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getBookingColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { LayoutSaveButton } from "@/components/shared/LayoutSaveButton";
import { RowModals } from "@/components/shared/RowModals";
import { VINLineCounter } from "@/components/shared/VINLineCounter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { printReservationLabels } from "@/lib/printing/reservationLabels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function BookingPage() {
	const { isDirty, saveLayout, saveAsDefault, resetLayout } =
		useColumnLayoutTracker("booking");
	const { data: bookingRowData = [] } = useOrdersQuery("booking");
	const bulkUpdateStageMutation = useBulkUpdateOrderStageMutation();
	const deleteOrderMutation = useDeleteOrderMutation();
	const saveOrderMutation = useSaveOrderMutation();

	const checkNotifications = useAppStore((state) => state.checkNotifications);

	useEffect(() => {
		if (bookingRowData) {
			checkNotifications();
		}
	}, [bookingRowData, checkNotifications]);

	const partStatuses = useAppStore((state) => state.partStatuses);

	const handleUpdateOrder = useCallback(
		(id: string, updates: Partial<PendingRow>) => {
			return saveOrderMutation.mutateAsync({ id, updates, stage: "booking" });
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

	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
	const [rebookingSearchTerm, setRebookingSearchTerm] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const _handleSelectionChanged = useMemo(
		() => (rows: PendingRow[]) => {
			setSelectedRows(rows);
		},
		[],
	);

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
	} = useRowModals(handleUpdateOrder, handleSendToArchive);

	const columns = useMemo(
		() =>
			getBookingColumns(
				(row) => handleNoteClick(row, "booking"),
				handleReminderClick,
				handleAttachClick,
			),
		[handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const handleConfirmReorder = async () => {
		if (!reorderReason.trim()) {
			toast.error("Please provide a reason for reorder");
			return;
		}
		const ids = selectedRows.map((r) => r.id);
		// 1. Update status/note (sequential but optimistic)
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
				stage: "booking",
			});
		}
		// 2. Move stage (bulk)
		await bulkUpdateStageMutation.mutateAsync({ ids, stage: "orders" });
		setSelectedRows([]);
		setIsReorderModalOpen(false);
		setReorderReason("");
		toast.success(
			`${selectedRows.length} row(s) sent back to Orders (Reorder)`,
		);
	};

	const handleConfirmRebooking = async (
		newDate: string,
		newNote: string,
		status?: string,
	) => {
		if (selectedRows.length === 0) return;
		for (const row of selectedRows) {
			const oldDate = row.bookingDate || "Unknown Date";
			const historyLog = `Rescheduled from ${oldDate} to ${newDate}.`;
			const fullNote = `${historyLog} ${newNote}`.trim();

			const updatedBookingNote = row.bookingNote
				? `${row.bookingNote}\n[System]: ${fullNote}`
				: `[System]: ${fullNote}`;

			// Append to actionNote for history
			let newActionNote = row.actionNote || "";
			const taggedNote = `${fullNote} #rebooking`;
			newActionNote = newActionNote
				? `${newActionNote}\n${taggedNote}`
				: taggedNote;

			await saveOrderMutation.mutateAsync({
				id: row.id,
				updates: {
					bookingDate: newDate,
					bookingNote: updatedBookingNote,
					actionNote: newActionNote,
					...(status ? { bookingStatus: status } : {}),
				},
				stage: "booking",
			});
		}
		setIsRebookingModalOpen(false);
		setSelectedRows([]);
		toast.success(`Rescheduled ${selectedRows.length} booking(s) successfully`);
	};

	const handleUpdatePartStatus = (status: string) => {
		if (selectedRows.length === 0) return;
		selectedRows.forEach((row) => {
			handleUpdateOrder(row.id, { partStatus: status });
		});
		toast.success(`Updated ${selectedRows.length} item(s) to ${status}`);
	};

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
								<Button
									size="icon"
									variant="ghost"
									className="text-gray-400 hover:text-white h-8 w-8"
									onClick={() => printReservationLabels(selectedRows)}
									disabled={selectedRows.length === 0}
								>
									<Tag className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Reserve/Print Label</TooltipContent>
						</Tooltip>

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
									className="text-gray-400 hover:text-white h-8 w-8"
									onClick={() => {
										if (selectedRows.length > 0) {
											handleArchiveClick(
												selectedRows[0],
												selectedRows.map((r) => r.id),
											);
										}
									}}
									disabled={selectedRows.length === 0}
								>
									<Archive className="h-3.5 w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Archive</TooltipContent>
						</Tooltip>

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
						<VINLineCounter rows={bookingRowData} />
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
						rowData={bookingRowData}
						columnDefs={columns}
						gridStateKey="booking"
						onSelectionChange={setSelectedRows}
						onGridReady={(api) => setGridApi(api)}
						showFloatingFilters={showFilters}
						enablePagination={true}
						pageSize={20}
					/>
				</div>

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
									placeholder="e.g., Wrong part, Customer cancelled"
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

				<BookingCalendarModal
					open={isRebookingModalOpen}
					onOpenChange={setIsRebookingModalOpen}
					selectedRows={selectedRows}
					initialSearchTerm={rebookingSearchTerm}
					onConfirm={handleConfirmRebooking}
				/>

				<RowModals
					activeModal={activeModal}
					currentRow={currentRow}
					onClose={closeModal}
					onSaveNote={saveNote}
					onSaveReminder={saveReminder}
					onSaveAttachment={saveAttachment}
					onSaveArchive={saveArchive}
					sourceTag="booking"
				/>

				<ConfirmDialog
					open={showDeleteConfirm}
					onOpenChange={setShowDeleteConfirm}
					onConfirm={async () => {
						for (const row of selectedRows) {
							await deleteOrderMutation.mutateAsync(row.id);
						}
						setSelectedRows([]);
						toast.success("Booking(s) deleted");
						setShowDeleteConfirm(false);
					}}
					title="Delete Bookings"
					description={`Are you sure you want to delete ${selectedRows.length} selected booking(s)?`}
					confirmText="Delete"
				/>
			</div>
		</TooltipProvider>
	);
}
