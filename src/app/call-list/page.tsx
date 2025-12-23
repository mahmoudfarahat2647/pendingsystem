"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import { Input } from "@/components/ui/input";
import type { PendingRow } from "@/types";
import { Phone, Calendar, Filter, Download, Trash2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export default function CallListPage() {
    const { callRowData, sendToBooking, deleteOrders, updateOrder } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
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

    const columns = useMemo(() => getBaseColumns(handleNoteClick, handleReminderClick, handleAttachClick), [handleNoteClick, handleReminderClick, handleAttachClick]);

    // Count unique VINs
    const uniqueVins = new Set(callRowData.map((r) => r.vin)).size;

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleOpenBookingModal = () => {
        setIsBookingModalOpen(true);
    };

    const handleConfirmBooking = (date: string, note: string, status?: string) => {
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

    const confirmDelete = () => {
        const ids = selectedRows.map((r) => r.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) deleted`);
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
                        <Button variant="outline" size="sm">
                            Archive
                        </Button>
                        <Button variant="outline" size="sm">
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

                        <div className="flex-1" />

                        <Button
                            variant={selectedRows.length === 0 ? "outline" : "renault"}
                            size="sm"
                            onClick={handleOpenBookingModal}
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
                                    Booking
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Grid */}
            <Card>
                <CardContent className="p-0">
                    <DataGrid
                        rowData={callRowData}
                        columnDefs={columns}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </CardContent>
            </Card>

            {/* Booking Calendar Modal */}
            <BookingCalendarModal
                open={isBookingModalOpen}
                onOpenChange={setIsBookingModalOpen}
                selectedRows={selectedRows}
                onConfirm={handleConfirmBooking}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                title="Delete Call List Items"
                description={`Are you sure you want to delete ${selectedRows.length} selected item(s)? This action cannot be undone.`}
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
