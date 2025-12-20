"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useStore";
import { DynamicDataGrid as DataGrid } from "@/components/shared/DynamicDataGrid";
import { getOrdersColumns } from "@/components/shared/GridConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfoLabel } from "@/components/shared/InfoLabel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { EditableSelect } from "@/components/shared/EditableSelect";
import type { PendingRow, PartEntry } from "@/types";
import { generateId, getCalculatorValues, detectModelFromVin, cn } from "@/lib/utils";
import {
    Plus,
    Printer,
    Send,
    Phone,
    FileSpreadsheet,
    Filter,
    Download,
    Tag,
    Calendar,
    Folder,
    Trash2,
    CheckCircle,
    Pencil,
    Clock,
    User,
    ClipboardList,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function OrdersPage() {
    const {
        ordersRowData,
        addOrders,
        updateOrder,
        commitToMainSheet,
        deleteOrders,
        models,
        addModel,
        removeModel,
        repairSystems,
        addRepairSystem,
        removeRepairSystem
    } = useAppStore();

    const [selectedRows, setSelectedRows] = useState<PendingRow[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        customerName: "",
        vin: "",
        mobile: "",
        cntrRdg: "",
        model: "",
        repairSystem: "Mechanical",
        startWarranty: new Date().toISOString().split("T")[0],
        requester: "",
    });

    const [parts, setParts] = useState<PartEntry[]>([{ id: generateId(), partNumber: "", description: "" }]);
    const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);

    const columns = useMemo(() => getOrdersColumns(), []);

    const handleSelectionChanged = (rows: PendingRow[]) => {
        setSelectedRows(rows);
    };

    const selectedOrderCount = selectedRows.length;
    const isSingleSelection = selectedOrderCount === 1;
    const isMultiSelection = selectedOrderCount > 1;
    const selectedOrder = isSingleSelection ? selectedRows[0] : null;

    useEffect(() => {
        if (formData.vin.length >= 6) {
            const detectedValue = detectModelFromVin(formData.vin);
            if (detectedValue && !formData.model) {
                setFormData(prev => ({ ...prev, model: detectedValue }));
            }
        }
    }, [formData.vin]);

    const handleOpenModal = (edit = false) => {
        setIsEditMode(edit);
        if (edit && selectedRows.length > 0) {
            const first = selectedRows[0];
            setFormData({
                customerName: first.customerName,
                vin: first.vin,
                mobile: first.mobile,
                cntrRdg: first.cntrRdg.toString(),
                model: first.model,
                repairSystem: first.repairSystem,
                startWarranty: first.startWarranty,
                requester: first.requester,
            });

            // Map selected rows to part rows in the modal.
            // When multiple rows are selected, each row essentially is one part entry in the grid.
            const initialParts = selectedRows.map(row => ({
                id: generateId(),
                partNumber: row.partNumber,
                description: row.description,
                rowId: row.id // Important for identifying which row to update
            }));
            setParts(initialParts);
        } else {
            setFormData({
                customerName: "",
                vin: "",
                mobile: "",
                cntrRdg: "",
                model: "",
                repairSystem: "Mechanical",
                startWarranty: new Date().toISOString().split("T")[0],
                requester: "",
            });
            setParts([{ id: generateId(), partNumber: "", description: "" }]);
        }
        setIsModalOpen(true);
    };

    const handleAddPartRow = () => {
        setParts([...parts, { id: generateId(), partNumber: "", description: "" }]);
    };

    const handleRemovePartRow = (id: string) => {
        // We only allow removing if there's more than 1 part or if we're in edit mode 
        // (removing a row in edit mode might mean we want to delete that entry)
        setParts(parts.filter(p => p.id !== id));
    };

    const handlePartChange = (id: string, field: keyof PartEntry, value: string) => {
        setParts(parts.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSubmit = () => {
        const warrantyCalc = getCalculatorValues(formData.startWarranty);

        if (isEditMode) {
            const existingRowIdsInModal = new Set(parts.map(p => p.rowId).filter(Boolean));

            // 1. Remove rows that were selected but removed from the modal
            const removedRowIds = selectedRows
                .filter(row => !existingRowIdsInModal.has(row.id))
                .map(row => row.id);
            if (removedRowIds.length > 0) {
                deleteOrders(removedRowIds);
            }

            // 2. Update existing rows and create new ones
            const newOrders: PendingRow[] = [];

            parts.forEach((part) => {
                const commonData = {
                    ...formData,
                    cntrRdg: parseInt(formData.cntrRdg) || 0,
                    endWarranty: warrantyCalc.endDate,
                    remainTime: warrantyCalc.remainTime,
                };

                if (part.rowId) {
                    // Update existing
                    updateOrder(part.rowId, {
                        ...commonData,
                        partNumber: part.partNumber,
                        description: part.description,
                        parts: [part]
                    });
                } else {
                    // Create new row for part added in bulk mode
                    const baseId = selectedRows[0]?.baseId || Date.now().toString().slice(-6);
                    newOrders.push({
                        id: generateId(),
                        baseId,
                        trackingId: `ORD-${baseId}`,
                        ...commonData,
                        partNumber: part.partNumber,
                        description: part.description,
                        parts: [part],
                        status: "Ordered",
                        rDate: new Date().toISOString().split("T")[0],
                        requester: formData.requester,
                    });
                }
            });

            if (newOrders.length > 0) {
                addOrders(newOrders);
            }

            toast.success("Grid entries updated successfully");
        } else {
            const baseId = Date.now().toString().slice(-6);
            const newOrders: PendingRow[] = parts.map((part, index) => ({
                id: generateId(),
                baseId: parts.length > 1 ? `${baseId}-${index + 1}` : baseId,
                trackingId: `ORD-${parts.length > 1 ? `${baseId}-${index + 1}` : baseId}`,
                ...formData,
                cntrRdg: parseInt(formData.cntrRdg) || 0,
                partNumber: part.partNumber,
                description: part.description,
                parts: [part], // Store individual part for later edits
                repairSystem: formData.repairSystem,
                startWarranty: formData.startWarranty,
                endWarranty: warrantyCalc.endDate,
                remainTime: warrantyCalc.remainTime,
                status: "Ordered",
                rDate: new Date().toISOString().split("T")[0],
                requester: formData.requester,
            }));
            addOrders(newOrders);
            toast.success(`${newOrders.length} order(s) created`);
        }

        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("Please select at least one order");
            return;
        }
        deleteOrders(selectedRows.map(r => r.id));
        setSelectedRows([]);
        toast.success("Order(s) deleted");
    };

    const handleCommit = () => {
        if (selectedRows.length === 0) return;
        commitToMainSheet(selectedRows.map(r => r.id));
        setSelectedRows([]);
        toast.success("Committed to Main Sheet");
    };

    const countdown = useMemo(() => {
        if (formData.repairSystem === "ضمان") {
            return getCalculatorValues(formData.startWarranty);
        }
        return null;
    }, [formData.repairSystem, formData.startWarranty]);

    return (
        <TooltipProvider>
            <div className="space-y-6 h-full flex flex-col">
                <InfoLabel data={selectedOrder} />

                <Card className="flex-1 flex flex-col border-none bg-transparent shadow-none">
                    <CardContent className="p-0 flex-1 flex flex-col space-y-4">
                        <div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className={cn(
                                                "transition-all duration-300",
                                                selectedOrderCount > 0
                                                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                                                    : "bg-renault-yellow hover:bg-renault-yellow/90 text-black"
                                            )}
                                            size="icon"
                                            onClick={() => handleOpenModal(selectedOrderCount > 0)}
                                        >
                                            {selectedOrderCount > 0 ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{selectedOrderCount > 0 ? `Edit ${selectedOrderCount > 1 ? "Orders" : "Order"}` : "Create Order"}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8">
                                            <Tag className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                </Tooltip>

                                <div className="w-px h-5 bg-white/10 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
                                            <Send className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share to Logistics</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Print Order</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-green-500/80 hover:text-green-500 h-8 w-8"
                                            disabled={selectedRows.length === 0}
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Booking</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-orange-500/80 hover:text-orange-500 h-8 w-8">
                                            <Phone className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send to Call List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Extract</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8">
                                            <Filter className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 h-8 w-8">
                                            <Folder className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Set Path</TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                                            onClick={handleDelete}
                                            disabled={selectedRows.length === 0}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className="bg-green-600 hover:bg-green-500 text-white border-none rounded-md h-8 w-8"
                                            size="icon"
                                            onClick={handleCommit}
                                            disabled={selectedRows.length === 0}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Commit to Main Sheet</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[500px] border border-white/10 rounded-xl overflow-hidden">
                            <DataGrid
                                rowData={ordersRowData}
                                columnDefs={columns}
                                onSelectionChanged={handleSelectionChanged}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-[#1c1c1e] text-white">
                        <div className={cn(
                            "p-6 transition-colors duration-500",
                            isEditMode
                                ? "bg-gradient-to-r from-amber-600 to-orange-600"
                                : "bg-gradient-to-r from-indigo-600 to-blue-600"
                        )}>
                            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                {isEditMode ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {isEditMode
                                    ? (isMultiSelection ? `Bulk Edit ${selectedOrderCount} Entries` : "Edit Order")
                                    : "Create New Logistics Entry"}
                            </DialogTitle>
                            <DialogDescription className="text-white/70 text-sm mt-1">
                                {isMultiSelection
                                    ? `Managing ${selectedOrderCount} entries for this VIN. You can edit, add, or remove parts individually.`
                                    : "High-efficiency command center for complex repairs"}
                            </DialogDescription>
                        </div>

                        <div className="p-6 grid grid-cols-12 gap-6 max-h-[70vh] overflow-y-auto">
                            {/* Left Column: Customer & Vehicle */}
                            <div className="col-span-12 lg:col-span-5 space-y-4">
                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                        <User className="h-3 w-3" /> Customer & Vehicle
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">Customer Name</Label>
                                        <Input
                                            value={formData.customerName}
                                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                            className="bg-white/5 border-white/10 h-9"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">VIN Number</Label>
                                        <Input
                                            value={formData.vin}
                                            onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                                            className="bg-white/5 border-white/10 h-9 font-mono"
                                            maxLength={17}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400">Mobile</Label>
                                            <Input
                                                value={formData.mobile}
                                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                                className="bg-white/5 border-white/10 h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400">Odometer</Label>
                                            <Input
                                                type="number"
                                                value={formData.cntrRdg}
                                                onChange={e => setFormData({ ...formData, cntrRdg: e.target.value })}
                                                className="bg-white/5 border-white/10 h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">Model</Label>
                                        <EditableSelect
                                            options={models}
                                            value={formData.model}
                                            onChange={val => setFormData({ ...formData, model: val })}
                                            onAdd={addModel}
                                            onRemove={removeModel}
                                            placeholder="Select or add model..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                        <Tag className="h-3 w-3" /> Workflow
                                    </h3>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">Repair System</Label>
                                        <EditableSelect
                                            options={repairSystems}
                                            value={formData.repairSystem}
                                            onChange={val => setFormData({ ...formData, repairSystem: val })}
                                            onAdd={addRepairSystem}
                                            onRemove={removeRepairSystem}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {formData.repairSystem === "ضمان" && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-3 pt-2 border-t border-white/10 overflow-hidden"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-400">ICM Start Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.startWarranty}
                                                        onChange={e => setFormData({ ...formData, startWarranty: e.target.value })}
                                                        className="bg-white/5 border-white/10 h-9"
                                                    />
                                                </div>
                                                {countdown && (
                                                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                        <Label className="text-[10px] text-indigo-400 uppercase font-bold">Remaining Warranty</Label>
                                                        <div className="flex items-center gap-2 text-indigo-300 font-mono text-sm mt-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {countdown.remainTime}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Column: Parts & Details */}
                            <div className="col-span-12 lg:col-span-7 space-y-4">
                                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10 h-full flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                            <ClipboardList className="h-3 w-3" /> Order Details / Parts
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] text-renault-yellow hover:text-renault-yellow hover:bg-renault-yellow/10"
                                            onClick={handleAddPartRow}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Part
                                        </Button>
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <AnimatePresence initial={false}>
                                            {parts.map((part, index) => (
                                                <motion.div
                                                    key={part.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="grid grid-cols-12 gap-2 group"
                                                >
                                                    <div className="col-span-4">
                                                        <Input
                                                            placeholder="Part Number"
                                                            value={part.partNumber}
                                                            onChange={e => handlePartChange(part.id, "partNumber", e.target.value)}
                                                            className="bg-white/5 border-white/10 h-9 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="col-span-7">
                                                        <Input
                                                            ref={(el) => (descriptionRefs.current[index] = el)}
                                                            placeholder="Description"
                                                            value={part.description}
                                                            onChange={e => handlePartChange(part.id, "description", e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddPartRow();
                                                                    setTimeout(() => {
                                                                        descriptionRefs.current[index + 1]?.focus();
                                                                    }, 0);
                                                                }
                                                            }}
                                                            className="bg-white/5 border-white/10 h-9 text-xs"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex items-center justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleRemovePartRow(part.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                                        <Label className="text-xs text-gray-400">Requester (Branch/Person)</Label>
                                        <Input
                                            value={formData.requester}
                                            onChange={e => setFormData({ ...formData, requester: e.target.value })}
                                            className="bg-white/5 border-white/10 h-9"
                                            placeholder="Enter requester..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5">
                            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className={cn(
                                    "px-8 h-10 font-bold",
                                    isEditMode ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-renault-yellow hover:bg-renault-yellow/90 text-black"
                                )}
                                onClick={handleSubmit}
                            >
                                {isEditMode
                                    ? (isMultiSelection ? `Update ${selectedOrderCount} Entries` : "Save Changes")
                                    : "Create Global Order"}
                                <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

// Add X icon for deletions if not imported (already imported as X from lucide-react above)
