"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBookingColumns } from "@/components/shared/GridConfig";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";
import { Calendar, Archive, RotateCcw, Filter, Download, Trash2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export default function BookingPage() {
    const { bookingRowData, sendToArchive, sendToReorder, deleteOrders, updateOrder } =
        useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [reorderReason, setReorderReason] = useState("");

    // Rebooking State
    const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
    const [rebookingSearchTerm, setRebookingSearchTerm] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Note Modal State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
    const [currentNoteRow, setCurrentNoteRow] = useState<PendingRow | null>(null);
    const [currentReminderRow, setCurrentReminderRow] = useState<PendingRow | null>(null);
    const [currentAttachmentRow, setCurrentAttachmentRow] = useState<PendingRow | null>(null);

    // Callback for Note Icon Click
    const handleNoteClick = React.useCallback((row: PendingRow) => {
        setCurrentNoteRow(row);
        setNoteModalOpen(true);
    }, []);

    // Callback for Reminder Icon Click
    const handleReminderClick = React.useCallback((row: PendingRow) => {
        setCurrentReminderRow(row);
        setReminderModalOpen(true);
    }, []);

    // Callback for Attachment Icon Click
    const handleAttachClick = React.useCallback((row: PendingRow) => {
        setCurrentAttachmentRow(row);
        setAttachmentModalOpen(true);
    }, []);

    const handleSaveNote = (content: string) => {
        if (currentNoteRow) {
            updateOrder(currentNoteRow.id, { actionNote: content });
            toast.success("Note saved");
        }
    };

    const handleSaveReminder = (data: { date: string; time: string; subject: string } | undefined) => {
        if (currentReminderRow) {
            updateOrder(currentReminderRow.id, { reminder: data });
            toast.success(data ? "Reminder set" : "Reminder cleared");
        }
    };

    const handleSaveAttachment = (path: string | undefined) => {
        if (currentAttachmentRow) {
            updateOrder(currentAttachmentRow.id, {
                attachmentPath: path,
                hasAttachment: !!path
            });
            toast.success(path ? "Attachment linked" : "Attachment cleared");
        }
    };

    const columns = useMemo(() => getBookingColumns(handleNoteClick, handleReminderClick, handleAttachClick), [handleNoteClick, handleReminderClick, handleAttachClick]);

    // Count unique VINs
    const uniqueVins = new Set(bookingRowData.map((r) => r.vin)).size;

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleArchive = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToArchive(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) archived`);
    };

    const handleOpenReorderModal = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        setIsReorderModalOpen(true);
    };

    const handleConfirmReorder = () => {
        if (!reorderReason.trim()) {
            toast.error("Please provide a reason for reorder");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToReorder(ids, reorderReason);
        setSelectedRows([]);
        setIsReorderModalOpen(false);
        setReorderReason("");
        toast.success(`${ids.length} row(s) sent back to Orders (Reorder)`);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        const ids = selectedRows.map((r) => r.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) deleted`);
    };

    const handleRebooking = () => {
        const vinCount = new Set(selectedRows.map(r => r.vin)).size;
        if (vinCount > 1) {
            toast.error("Please select bookings for only one VIN at a time");
            return;
        }

        const row = selectedRows[0];
        // Use VIN or customer name as search term if available, otherwise empty for History
        setRebookingSearchTerm(row?.vin || row?.customerName || "");
        setIsRebookingModalOpen(true);
    };

    const handleConfirmRebooking = (newDate: string, newNote: string) => {
        if (selectedRows.length === 0) return;

        // Update all selected rows
        selectedRows.forEach(row => {
            const oldDate = row.bookingDate || "Unknown Date";
            const historyLog = `Rescheduled from ${oldDate} to ${newDate}.`;
            const updatedNote = row.bookingNote
                ? `${row.bookingNote}\n[System]: ${historyLog} ${newNote}`
                : `[System]: ${historyLog} ${newNote}`;

            updateOrder(row.id, {
                bookingDate: newDate,
                bookingNote: updatedNote.trim()
            });
        });

        setIsRebookingModalOpen(false);
        setSelectedRows([]);
        toast.success(`Rescheduled ${selectedRows.length} booking(s) successfully`);
    };

    return (
        <div className="space-y-4">
            {/* Info Label Component */}
            <InfoLabel data={selectedRows[0] || null} />

            {/* Header Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Service Appointments
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Scheduled maintenance
                            </p>
                        </div>
                        <div className="text-sm">
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded">
                                Unique Bookings
                            </span>
                            <span className="ml-2 text-renault-yellow font-semibold">
                                {uniqueVins} Unique ({bookingRowData.length} Lines)
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={selectedRows.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleArchive}
                            disabled={selectedRows.length === 0}
                        >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                        </Button>
                        <Button
                            variant={selectedRows.length === 0 ? "outline" : "outline"}
                            size="sm"
                            className={cn(
                                "border-renault-yellow/20",
                                selectedRows.length === 0
                                    ? "text-gray-400"
                                    : "text-renault-yellow hover:text-renault-yellow/80 hover:bg-renault-yellow/10"
                            )}
                            onClick={handleRebooking}
                            disabled={new Set(selectedRows.map(r => r.vin)).size > 1}
                        >
                            {selectedRows.length === 0 ? (
                                <>
                                    <HistoryIcon className="h-4 w-4 mr-1" />
                                    History
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Rebooking
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-500"
                            onClick={handleOpenReorderModal}
                            disabled={selectedRows.length === 0}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reorder
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Extract
                        </Button>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Grid */}
            <Card>
                <CardContent className="p-0">
                    <DataGrid
                        rowData={bookingRowData}
                        columnDefs={columns}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </CardContent>
            </Card>

            {/* Reorder Modal */}
            <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
                <DialogContent>
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

            {/* Booking Calendar Modal for Rebooking */}
            <BookingCalendarModal
                open={isRebookingModalOpen}
                onOpenChange={setIsRebookingModalOpen}
                selectedRows={selectedRows}
                initialSearchTerm={rebookingSearchTerm}
                onConfirm={handleConfirmRebooking}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                title="Delete Bookings"
                description={`Are you sure you want to delete ${selectedRows.length} selected booking(s)? This action cannot be undone.`}
                confirmText="Delete"
            />

            {/* Note Edit Modal */}
            <EditNoteModal
                open={noteModalOpen}
                onOpenChange={setNoteModalOpen}
                initialContent={currentNoteRow?.actionNote || ""}
                onSave={handleSaveNote}
            />

            {/* Reminder Edit Modal */}
            <EditReminderModal
                open={reminderModalOpen}
                onOpenChange={setReminderModalOpen}
                initialData={currentReminderRow?.reminder}
                onSave={handleSaveReminder}
            />

            {/* Attachment Edit Modal */}
            <EditAttachmentModal
                open={attachmentModalOpen}
                onOpenChange={setAttachmentModalOpen}
                initialPath={currentAttachmentRow?.attachmentPath || ""}
                onSave={handleSaveAttachment}
            />
        </div>
    );
}
