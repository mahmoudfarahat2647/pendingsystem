"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    Package,
    Plus,
    User,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PartEntry } from "@/types";
import type { FormData, PartWarning } from "./types";

interface PartsSectionProps {
    parts: PartEntry[];
    onAddPart: () => void;
    onRemovePart: (id: string) => void;
    onPartChange: (id: string, field: keyof PartEntry, value: string) => void;
    onCheckDuplicate: (
        partId: string,
        vin: string,
        partNumber: string,
    ) => Promise<void>;
    onBulkImport: (parts: PartEntry[]) => void;
    partValidationWarnings: Record<string, PartWarning>;
    formData: FormData;
    onFieldChange: (updated: Partial<FormData>) => void;
    isEditMode: boolean;
    validationMode: "easy" | "beast";
    descriptionRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

/**
 * Right panel of the order form.
 * Renders the parts (Components) section and the requester field.
 * Owns the bulk-import textarea state internally.
 */
export const PartsSection = ({
    parts,
    onAddPart,
    onRemovePart,
    onPartChange,
    onCheckDuplicate,
    onBulkImport,
    partValidationWarnings,
    formData,
    onFieldChange,
    isEditMode,
    validationMode,
    descriptionRefs,
}: PartsSectionProps) => {
    // Parts bulk import state — owned here, not in the hook
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState("");

    const handleBulkImport = () => {
        if (!bulkText.trim()) return;
        const lines = bulkText.split("\n");
        const newParts = lines
            .map((line) => {
                const rowParts = line.split(/\t|\s{4,}/).filter(Boolean);
                if (rowParts.length === 0) return null;
                return {
                    id: generateId(),
                    partNumber: (rowParts[0]?.trim() || "").toUpperCase(),
                    description: rowParts.slice(1).join(" ").trim() || "",
                };
            })
            .filter(
                (p): p is PartEntry =>
                    p !== null && (p.partNumber !== "" || p.description !== ""),
            );

        if (newParts.length > 0) {
            onBulkImport(newParts);
            setBulkText("");
            setIsBulkMode(false);
            toast.success(`${newParts.length} parts imported`);
        }
    };

    const focusColor = isEditMode
        ? "focus:ring-amber-500/30"
        : "focus:ring-indigo-500/30";

    return (
        <div className="col-span-12 lg:col-span-7 flex flex-col min-h-[300px]">
            <div className="flex-1 bg-white/[0.01] rounded-2xl border border-white/5 p-4 flex flex-col relative overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-3 w-3 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                            Components
                        </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-lg transition-all",
                                isBulkMode
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10",
                            )}
                            onClick={() => setIsBulkMode(!isBulkMode)}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                isEditMode
                                    ? "text-amber-500 hover:bg-amber-500/10"
                                    : "text-indigo-400 hover:bg-indigo-500/10",
                            )}
                            onClick={onAddPart}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add Entry
                        </Button>
                    </div>
                </div>

                {/* Parts list or bulk mode */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {isBulkMode ? (
                            <motion.div
                                key="bulk-mode"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="h-full flex flex-col space-y-3"
                            >
                                <div className="relative group/bulk flex-1 min-h-[160px]">
                                    <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-hover/bulk:opacity-100 transition-opacity" />
                                    <Textarea
                                        placeholder="Paste your part list here..."
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                        className="relative h-full resize-none bg-[#0a0a0b]/60 border-white/5 text-[10px] font-mono p-3 rounded-xl focus:ring-1 focus:ring-indigo-500/30 placeholder:text-slate-600 custom-scrollbar"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleBulkImport}
                                        disabled={!bulkText.trim()}
                                        className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        Import Parsed Data
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsBulkMode(false);
                                            setBulkText("");
                                        }}
                                        className="h-8 px-3 rounded-lg text-slate-500 hover:text-white text-[10px] font-black uppercase"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list-mode"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <AnimatePresence initial={false}>
                                    {parts.map((part, index) => (
                                        <motion.div
                                            key={part.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                        >
                                            <div
                                                className={cn(
                                                    "flex flex-col gap-1 p-1.5 rounded-xl border transition-all hover:bg-white/[0.04]",
                                                    partValidationWarnings[part.id]
                                                        ? "bg-red-500/5 border-red-500/20"
                                                        : "bg-white/[0.02] border-white/5",
                                                    "group/row",
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1/3">
                                                        <Input
                                                            placeholder="REF#"
                                                            value={part.partNumber}
                                                            onChange={(e) => {
                                                                const val = e.target.value.toUpperCase();
                                                                onPartChange(part.id, "partNumber", val);
                                                            }}
                                                            onBlur={() =>
                                                                onCheckDuplicate(
                                                                    part.id,
                                                                    formData.vin,
                                                                    part.partNumber,
                                                                )
                                                            }
                                                            className={cn(
                                                                "bg-white/5 border-white/5 h-8 text-[10px] font-mono rounded-lg px-2 focus:ring-1",
                                                                focusColor,
                                                                validationMode === "beast" &&
                                                                !part.partNumber.trim() &&
                                                                "border-red-500/50 ring-1 ring-red-500/30",
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input
                                                            ref={(el) => {
                                                                descriptionRefs.current[index] = el;
                                                            }}
                                                            placeholder="Description"
                                                            value={part.description}
                                                            onChange={(e) =>
                                                                onPartChange(
                                                                    part.id,
                                                                    "description",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    onAddPart();
                                                                    setTimeout(() => {
                                                                        descriptionRefs.current[index + 1]?.focus();
                                                                    }, 0);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "bg-white/5 border-white/5 h-8 text-[10px] rounded-lg px-2 focus:ring-1",
                                                                focusColor,
                                                                validationMode === "beast" &&
                                                                !part.description.trim() &&
                                                                "border-red-500/50 ring-1 ring-red-500/30",
                                                            )}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-600 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                        onClick={() => onRemovePart(part.id)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                {partValidationWarnings[part.id] && (
                                                    <div className="px-2 pb-1 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-red-400">
                                                            <AlertCircle className="h-3 w-3" />
                                                            <span className="text-[9px] font-bold uppercase tracking-tight">
                                                                {partValidationWarnings[part.id].type ===
                                                                    "duplicate"
                                                                    ? `${partValidationWarnings[part.id].value} in ${partValidationWarnings[part.id].location}`
                                                                    : `Existing Name: "${partValidationWarnings[part.id].value}"`}
                                                            </span>
                                                        </div>
                                                        {partValidationWarnings[part.id].type ===
                                                            "mismatch" && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 rounded-md hover:bg-red-500/20 text-red-500"
                                                                    onClick={() =>
                                                                        onPartChange(
                                                                            part.id,
                                                                            "description",
                                                                            partValidationWarnings[part.id].value,
                                                                        )
                                                                    }
                                                                    title="Apply existing name"
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {parts.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center space-y-2 py-10 opacity-10">
                                        <Package className="h-8 w-8" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">
                                            Idle
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Requester field */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 group">
                        <User
                            className="h-3 w-3 text-slate-600"
                            aria-label="Requester"
                        />
                        <Input
                            placeholder="Requester"
                            value={formData.requester}
                            onChange={(e) => onFieldChange({ requester: e.target.value })}
                            className={cn(
                                "h-8 text-xs px-0 transition-all text-slate-400 focus:text-slate-200",
                                isEditMode
                                    ? "focus:border-amber-500/20"
                                    : "focus:border-indigo-500/20",
                                /* getFieldError is accessed via partValidationWarnings context —
                                   requester field error is shown in easy mode only */
                                "bg-transparent border-transparent hover:bg-white/5 focus:bg-white/5 focus:border-white/5",
                            )}
                            aria-label="Requester name"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
