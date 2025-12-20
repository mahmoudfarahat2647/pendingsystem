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
    Search,
    Filter,
    Download,
    MoreVertical,
    ClipboardList,
    Package,
    Clock,
    CheckCircle,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    Pencil,
    Trash2,
    User,
    Phone,
    Send,
    Tag,
    Folder,
    X,
    MapPin,
    Printer,
    FileSpreadsheet,
    Calendar
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
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border border-white/5 bg-[#0c0c0e] text-slate-200 shadow-2xl shadow-black/50">
                        {/* Glass-morphism Header - Compact Version */}
                        <div className="relative overflow-hidden group">
                            <div className={cn(
                                "absolute inset-0 opacity-15 blur-xl transition-all duration-700",
                                isEditMode ? "bg-amber-500" : "bg-indigo-500"
                            )} />
                            <div className={cn(
                                "relative px-6 py-4 border-b border-white/5 backdrop-blur-md flex items-center justify-between",
                                isEditMode ? "bg-amber-500/10" : "bg-indigo-500/10"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors duration-500 shadow-md",
                                        isEditMode ? "bg-amber-500 text-black" : "bg-indigo-500 text-white"
                                    )}>
                                        {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold tracking-tight text-white leading-none">
                                            {isEditMode
                                                ? (isMultiSelection ? `Bulk Edit (${selectedOrderCount})` : "Modify Order")
                                                : "New Logistics Request"}
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider font-bold">
                                            {isMultiSelection
                                                ? "Synchronizing batch metadata"
                                                : "Vehicle Repair Command Center"}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end mr-4">
                                        <span className="text-[9px] uppercase font-black text-slate-600 tracking-tighter">System Status</span>
                                        <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 leading-none">
                                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 grid grid-cols-12 gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Left Column: Metadata */}
                            <div className="col-span-12 lg:col-span-5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-3 w-3 text-slate-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Core Identity</h3>
                                    </div>

                                    <div className="space-y-1 group">
                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 group-focus-within:text-slate-300 transition-colors uppercase">Customer</Label>
                                        <Input
                                            placeholder="Full Name"
                                            value={formData.customerName}
                                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                            className={cn(
                                                "bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
                                                isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-1 group">
                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 group-focus-within:text-slate-300 transition-colors uppercase">VIN Number</Label>
                                        <Input
                                            placeholder="VF1..."
                                            value={formData.vin}
                                            onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                                            className={cn(
                                                "bg-[#161618] border-white/5 h-9 text-xs font-mono tracking-widest rounded-lg px-3 transition-all",
                                                isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                            )}
                                            maxLength={17}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1 group">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Mobile</Label>
                                            <Input
                                                placeholder="0xxxxxxxxx"
                                                value={formData.mobile}
                                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                                className={cn(
                                                    "bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
                                                    isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-1 group">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Odo (KM)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={formData.cntrRdg}
                                                onChange={e => setFormData({ ...formData, cntrRdg: e.target.value })}
                                                className={cn(
                                                    "bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
                                                    isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 group">
                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Vehicle Model</Label>
                                        <div className={cn(
                                            "rounded-lg transition-all",
                                            isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                        )}>
                                            <EditableSelect
                                                options={models}
                                                value={formData.model}
                                                onChange={val => setFormData({ ...formData, model: val })}
                                                onAdd={addModel}
                                                onRemove={removeModel}
                                                placeholder="Select model..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Tag className="h-3 w-3 text-slate-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Workflow</h3>
                                    </div>

                                    <div className={cn(
                                        "grid gap-3 transition-all duration-300",
                                        formData.repairSystem === "ضمان" ? "grid-cols-12" : "grid-cols-1"
                                    )}>
                                        <div className={cn(
                                            "space-y-1 group",
                                            formData.repairSystem === "ضمان" ? "col-span-4" : "col-span-1"
                                        )}>
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Repair System</Label>
                                            <div className={cn(
                                                "rounded-lg transition-all",
                                                isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                            )}>
                                                <EditableSelect
                                                    options={repairSystems}
                                                    value={formData.repairSystem}
                                                    onChange={val => setFormData({ ...formData, repairSystem: val })}
                                                    onAdd={addRepairSystem}
                                                    onRemove={removeRepairSystem}
                                                />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {formData.repairSystem === "ضمان" && (
                                                <>
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        className="col-span-4 space-y-1 group"
                                                    >
                                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">ICM Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.startWarranty}
                                                            onChange={e => setFormData({ ...formData, startWarranty: e.target.value })}
                                                            className={cn(
                                                                "bg-[#161618] border-white/5 h-8 text-xs rounded-lg px-2 transition-all",
                                                                isEditMode ? "premium-glow-amber" : "premium-glow-indigo"
                                                            )}
                                                        />
                                                    </motion.div>
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="col-span-4 space-y-1"
                                                    >
                                                        <Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">Status</Label>
                                                        <div className="flex items-center h-8">
                                                            {countdown && (
                                                                <div className="w-full h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden shadow-inner">
                                                                    <span className="text-xs text-white font-mono font-black tracking-tight">
                                                                        {countdown.remainTime}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Parts Grid */}
                            <div className="col-span-12 lg:col-span-7 flex flex-col min-h-[300px]">
                                <div className="flex-1 bg-white/[0.01] rounded-2xl border border-white/5 p-4 flex flex-col relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="h-3 w-3 text-slate-500" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                                                Components
                                            </h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                isEditMode
                                                    ? "text-amber-500 hover:bg-amber-500/10"
                                                    : "text-indigo-400 hover:bg-indigo-500/10"
                                            )}
                                            onClick={handleAddPartRow}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Entry
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        <AnimatePresence initial={false}>
                                            {parts.map((part, index) => (
                                                <motion.div
                                                    key={part.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                >
                                                    <div className="flex items-center gap-2 bg-white/[0.02] hover:bg-white/[0.04] p-1.5 rounded-xl border border-white/5 group/row transition-all">
                                                        <div className="w-1/3">
                                                            <Input
                                                                placeholder="REF#"
                                                                value={part.partNumber}
                                                                onChange={e => handlePartChange(part.id, "partNumber", e.target.value)}
                                                                className={cn(
                                                                    "bg-white/5 border-white/5 h-8 text-[10px] font-mono rounded-lg px-2 focus:ring-1",
                                                                    isEditMode ? "focus:ring-amber-500/30" : "focus:ring-indigo-500/30"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
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
                                                                className={cn(
                                                                    "bg-white/5 border-white/5 h-8 text-[10px] rounded-lg px-2 focus:ring-1",
                                                                    isEditMode ? "focus:ring-amber-500/30" : "focus:ring-indigo-500/30"
                                                                )}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-600 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                            onClick={() => handleRemovePartRow(part.id)}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {parts.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center space-y-2 py-10 opacity-10">
                                                <Package className="h-8 w-8" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Idle</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Requester Inline */}
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 group">
                                            <MapPin className="h-3 w-3 text-slate-600" />
                                            <Input
                                                placeholder="Requester / Branch"
                                                value={formData.requester}
                                                onChange={e => setFormData({ ...formData, requester: e.target.value })}
                                                className={cn(
                                                    "bg-transparent border-transparent h-8 text-xs px-0 hover:bg-white/5 focus:bg-white/5 focus:border-white/5 transition-all text-slate-400 focus:text-slate-200",
                                                    isEditMode ? "focus:border-amber-500/20" : "focus:border-indigo-500/20"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 bg-white/[0.01] border-t border-white/5">
                            <div className="flex items-center justify-between w-full">
                                <Button
                                    variant="ghost"
                                    className="h-9 px-4 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={cn(
                                        "h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]",
                                        isEditMode
                                            ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10"
                                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10"
                                    )}
                                    onClick={handleSubmit}
                                >
                                    {isEditMode
                                        ? (isMultiSelection ? "Commit Batch" : "Commit")
                                        : "Publish"}
                                    <CheckCircle2 className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

// Add X icon for deletions if not imported (already imported as X from lucide-react above)
