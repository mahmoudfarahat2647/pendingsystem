"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getMainSheetColumns } from "@/components/shared/GridConfig";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import type { PendingRow } from "@/types";
import {
    FileSpreadsheet,
    Phone,
    Filter,
    Download,
    Lock,
    Unlock,
    Tag,
    Send,
    Printer,
    Calendar,
    Trash2,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function MainSheetPage() {
    const { rowData, sendToCallList, partStatuses, updatePartStatus, updateOrder, deleteOrders, sendToBooking } = useAppStore();
    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isLocked, setIsLocked] = useState(true); // Locked by default
    const [showUnlockDialog, setShowUnlockDialog] = useState(false);

    // Note Modal State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
    const [currentNoteRow, setCurrentNoteRow] = useState<PendingRow | null>(null);
    const [currentReminderRow, setCurrentReminderRow] = useState<PendingRow | null>(null);
    const [currentAttachmentRow, setCurrentAttachmentRow] = useState<PendingRow | null>(null);

    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [autoLockCountdown, setAutoLockCountdown] = useState<number | null>(null);

    // Callback for Note Icon Click
    const handleNoteClick = useCallback((row: PendingRow) => {
        setCurrentNoteRow(row);
        setNoteModalOpen(true);
    }, []);

    // Callback for Reminder Icon Click
    const handleReminderClick = useCallback((row: PendingRow) => {
        setCurrentReminderRow(row);
        setReminderModalOpen(true);
    }, []);

    // Callback for Attachment Icon Click
    const handleAttachClick = useCallback((row: PendingRow) => {
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

    const columns = useMemo(() => getMainSheetColumns(partStatuses, handleNoteClick, handleReminderClick, handleAttachClick), [partStatuses, handleNoteClick, handleReminderClick, handleAttachClick]);

    // Auto-lock after 5 minutes of inactivity
    const resetAutoLockTimer = useCallback(() => {
        if (autoLockTimerRef.current) {
            clearTimeout(autoLockTimerRef.current);
        }

        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        if (!isLocked) {
            // Set the auto-lock timer
            const timer = setTimeout(() => {
                setIsLocked(true);
                setAutoLockCountdown(null);
                toast.info("Sheet automatically locked after 5 minutes of inactivity");
            }, 5 * 60 * 1000); // 5 minutes

            autoLockTimerRef.current = timer;

            // Set the countdown timer for UI display
            const countdownStart = 5 * 60; // 5 minutes in seconds
            setAutoLockCountdown(countdownStart);

            const countdownTimer = setInterval(() => {
                setAutoLockCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(countdownTimer);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            countdownIntervalRef.current = countdownTimer;
        }
    }, [isLocked]);

    // Set up auto-lock timer
    useEffect(() => {
        resetAutoLockTimer();

        // Reset timer on any user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const resetTimer = () => resetAutoLockTimer();

        events.forEach(event => document.addEventListener(event, resetTimer));

        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isLocked]);

    const handleLockToggle = () => {
        if (isLocked) {
            // Show confirmation dialog when unlocking
            setShowUnlockDialog(true);
        } else {
            // Lock immediately
            setIsLocked(true);
            if (autoLockTimerRef.current) {
                clearTimeout(autoLockTimerRef.current);
                autoLockTimerRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
            setAutoLockCountdown(null);
        }
    };

    const confirmUnlock = () => {
        setIsLocked(false);
        setShowUnlockDialog(false);
        resetAutoLockTimer();
    };

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const handleSendToCallList = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        const ids = selectedRows.map((r) => r.id);
        sendToCallList(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) sent to Call List`);
    };

    const handleUpdatePartStatus = (status: string) => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        selectedRows.forEach((row) => {
            updatePartStatus(row.id, status);
        });
        toast.success(`Part status updated to "${status}"`);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one row");
            return;
        }
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        const ids = selectedRows.map(row => row.id);
        deleteOrders(ids);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) deleted`);
    };

    const handleConfirmBooking = (date: string, note: string, status?: string) => {
        const ids = selectedRows.map((r) => r.id);
        sendToBooking(ids, date, note, status);
        setSelectedRows([]);
        toast.success(`${ids.length} row(s) sent to Booking`);
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Info Label Component */}
                <InfoLabel data={selectedRows[0] || null} />

                {/* Header Card - Header Removed for Compact Layout */}
                <Card className="border-none bg-transparent shadow-none">
                    <CardContent className="p-0">
                        {/* Lock Status Indicator - Only show when unlocked */}
                        {!isLocked && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-t-lg text-green-400 text-sm">
                                <Unlock className="h-4 w-4" />
                                <span>Sheet is unlocked - Editing enabled</span>
                                {autoLockCountdown !== null && (
                                    <span className="ml-auto text-xs">
                                        Auto-lock in: {Math.floor(autoLockCountdown / 60)}:{String(autoLockCountdown % 60).padStart(2, '0')}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="flex items-center justify-between bg-[#141416] p-2 rounded-xl border border-white/5">
                            {/* Left Group */}
                            <div className="flex items-center gap-2">
                                {/* Part Statuses mixed in or first? Keeping first as primary action */}
                                {partStatuses.map((status) => (
                                    <Tooltip key={status.id}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUpdatePartStatus(status.label)}
                                                disabled={isLocked || selectedRows.length === 0}
                                                className="hover:bg-white/5"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Set status: {status.label}</TooltipContent>
                                    </Tooltip>
                                ))}

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-lg">
                                            <Tag className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Print</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-green-500/80 hover:text-green-500 hover:bg-green-500/10"
                                            disabled={isLocked || selectedRows.length === 0}
                                            onClick={() => setIsBookingModalOpen(true)}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Booking</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleSendToCallList}
                                            disabled={isLocked || selectedRows.length === 0}
                                            className="text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send to Call List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Extract</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter</TooltipContent>
                                </Tooltip>


                            </div>

                            {/* Right Group: Actions */}
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={handleDelete}
                                            disabled={isLocked || selectedRows.length === 0}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={`${isLocked ? "text-red-400" : "text-gray-400"} hover:text-white hover:bg-white/5`}
                                            onClick={handleLockToggle}
                                        >
                                            {isLocked ? (
                                                <Lock className="h-4 w-4" />
                                            ) : (
                                                <Unlock className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isLocked ? "Unlock Sheet" : "Lock Sheet"}</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Grid */}
                <Card>
                    <CardContent className="p-0">
                        <DataGrid
                            rowData={rowData}
                            columnDefs={columns}
                            onSelectionChanged={handleSelectionChanged}
                            onCellValueChanged={(params) => {
                                if (params.colDef.field === 'partStatus' && params.newValue !== params.oldValue) {
                                    updatePartStatus(params.data.id, params.newValue);
                                }
                            }}
                            readOnly={isLocked}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Unlock Confirmation Dialog */}
            <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                <DialogContent className="sm:max-w-[425px] bg-[#1c1c1e] border border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Unlock Sheet</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Are you sure you want to unlock the sheet? This will allow editing and copy-paste operations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowUnlockDialog(false)}
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmUnlock}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Yes, Unlock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Note Edit Modal */}
            <EditNoteModal
                open={noteModalOpen}
                onOpenChange={setNoteModalOpen}
                initialContent={currentNoteRow?.actionNote || ""}
                onSave={handleSaveNote}
            />

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

            {/* Booking Calendar Modal */}
            <BookingCalendarModal
                open={isBookingModalOpen}
                onOpenChange={setIsBookingModalOpen}
                onConfirm={handleConfirmBooking}
                selectedRows={selectedRows}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                title="Delete Records"
                description={`Are you sure you want to delete ${selectedRows.length} selected record(s)? This action cannot be undone.`}
                confirmText="Delete"
            />
        </TooltipProvider>
    );
}
