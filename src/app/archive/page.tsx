"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getBaseColumns } from "@/components/shared/GridConfig";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";
import { Archive, Trash2, Filter, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function ArchivePage() {
    const { archiveRowData, deleteOrders, updateOrder } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);

    // Note Modal State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [currentNoteRow, setCurrentNoteRow] = useState<PendingRow | null>(null);
    const [currentReminderRow, setCurrentReminderRow] = useState<PendingRow | null>(null);

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

    // Add BOOKING column and ACTION column to base columns
    const columns = useMemo(() => {
        const baseColumns = getBaseColumns(handleNoteClick, handleReminderClick);
        return [
            ...baseColumns.slice(0, 3),
            {
                headerName: "BOOKING",
                field: "bookingDate",
                width: 120,
            },
            ...baseColumns.slice(3),
        ];
    }, [handleNoteClick, handleReminderClick]);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
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
        </div>
    );
}
