"use client";

import {
	Calendar,
	Download,
	Filter,
	History as HistoryIcon,
	Phone,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { RowModals } from "@/components/shared/RowModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowModals } from "@/hooks/useRowModals";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export default function CallListPage() {
	const { callRowData, sendToBooking, deleteOrders, updateOrder } =
		useAppStore();
	const [gridApi, setGridApi] = useState<any>(null);
	const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
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
	} = useRowModals(updateOrder);

	const columns = useMemo(
		() =>
			getBaseColumns(handleNoteClick, handleReminderClick, handleAttachClick),
		[handleNoteClick, handleReminderClick, handleAttachClick],
	);

	const uniqueVins = new Set(callRowData.map((r) => r.vin)).size;

	const handleConfirmBooking = (
		date: string,
		note: string,
		status?: string,
	) => {
		const ids = selectedRows.map((r) => r.id);
		sendToBooking(ids, date, note, status);
		setSelectedRows([]);
		toast.success(`${ids.length} row(s) sent to Booking`);
	};

	const handleDelete = () => {
		if (selectedRows.length === 0) {
			toast.error("Please select at least one row");
			return;
		}
		setShowDeleteConfirm(true);
	};

	return (
		<div className="space-y-4">
			<InfoLabel data={selectedRows[0] || null} />

			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Phone className="h-5 w-5" />
								Call List
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Customers to contact
							</p>
						</div>
						<div className="text-sm">
							<span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded">
								Pending Calls
							</span>
							<span className="ml-2 text-renault-yellow font-semibold">
								{uniqueVins} Unique ({callRowData.length} Lines)
							</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDelete}
							disabled={selectedRows.length === 0}
						>
							<Trash2 className="h-4 w-4 mr-1" /> Delete
						</Button>
						<Button variant="outline" size="sm">
							Archive
						</Button>
						<Button variant="outline" size="sm">
							Reorder
						</Button>
						<Button variant="outline" size="sm" onClick={() => gridApi?.exportDataAsCsv()}>
							<Download className="h-4 w-4 mr-1" /> Extract
						</Button>
						<Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
							<Filter className="h-4 w-4 mr-1" /> Filter
						</Button>

						<div className="flex-1" />

						<Button
							variant={selectedRows.length === 0 ? "outline" : "renault"}
							size="sm"
							onClick={() => setIsBookingModalOpen(true)}
							disabled={new Set(selectedRows.map((r) => r.vin)).size > 1}
						>
							{selectedRows.length === 0 ? (
								<>
									<HistoryIcon className="h-4 w-4 mr-1" /> History
								</>
							) : (
								<>
									<Calendar className="h-4 w-4 mr-1" /> Booking
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					<DataGrid
						rowData={callRowData}
						columnDefs={columns}
						onSelectionChanged={setSelectedRows}
						onGridReady={(api) => setGridApi(api)}
						showFloatingFilters={showFilters}
					/>
				</CardContent>
			</Card>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
			/>

			<BookingCalendarModal
				open={isBookingModalOpen}
				onOpenChange={setIsBookingModalOpen}
				selectedRows={selectedRows}
				onConfirm={handleConfirmBooking}
			/>

			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={() => {
					deleteOrders(selectedRows.map((r) => r.id));
					setSelectedRows([]);
					toast.success("Row(s) deleted");
				}}
				title="Delete Call List Items"
				description={`Are you sure you want to delete ${selectedRows.length} selected item(s)?`}
				confirmText="Delete"
			/>
		</div>
	);
}
