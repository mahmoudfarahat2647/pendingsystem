"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";
import { Archive, Trash2, Filter, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function ArchivePage() {
    const { archiveRowData, deleteOrders, updateOrder } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
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

    // Add BOOKING column and ACTION column to base columns
    const columns = useMemo(() => {
        const baseColumns = getBaseColumns(handleNoteClick, handleReminderClick, handleAttachClick);
        return [
            ...baseColumns.slice(0, 3),
            {
                headerName: "BOOKING",
                field: "bookingDate",
                width: 120,
            },
            ...baseColumns.slice(3),
        ];
    }, [handleNoteClick, handleReminderClick, handleAttachClick]);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
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
        toast.success(`${ids.length} row(s) permanently deleted`);
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
                                <Archive className="h-5 w-5" />
                                Archive
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Historical records
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {archiveRowData.length} archived items
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
                            className="text-orange-500"
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
                        rowData={archiveRowData}
                        columnDefs={columns}
                        onSelectionChanged={handleSelectionChanged}
                    />
                </CardContent>
            </Card>


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

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                title="Delete Archived Records"
                description={`Are you sure you want to permanently delete ${selectedRows.length} selected record(s)? This action cannot be undone.`}
                confirmText="Permanently Delete"
            />
        </div>
    );
}
