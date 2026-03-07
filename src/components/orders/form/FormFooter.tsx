"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateEndWarranty, calculateRemainingTime, cn } from "@/lib/utils";
import type { FormData, PartWarning } from "./types";

interface FormFooterProps {
    isEditMode: boolean;
    isMultiSelection: boolean;
    formData: FormData;
    isHighMileage: boolean;
    hasValidationErrors: boolean;
    partValidationWarnings: Record<string, PartWarning>;
    onSubmit: () => void;
    onCancel: () => void;
}

/**
 * Footer of the order form.
 * Contains cancel button, warranty status badge, validation error indicators,
 * and the primary submit (Publish/Confirm) button.
 */
export const FormFooter = ({
    isEditMode,
    isMultiSelection,
    formData,
    isHighMileage,
    hasValidationErrors,
    partValidationWarnings,
    onSubmit,
    onCancel,
}: FormFooterProps) => {
    return (
        <DialogFooter className="px-6 py-4 bg-white/[0.01] border-t border-white/5">
            <div className="flex items-center justify-between w-full">
                {/* Left side: cancel + warranty status */}
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-4 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>

                    <AnimatePresence>
                        {/* [CRITICAL] Warranty Status Footer - Real-time calculations for Repair System "ضمان"
						    This section provides essential visibility for warranty/mileage status. */}
                        {formData.repairSystem === "ضمان" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-[9px] font-bold text-slate-500 uppercase">
                                    Warranty:
                                </span>
                                {isHighMileage ? (
                                    <div
                                        className="h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden shadow-inner uppercase tracking-tighter cursor-help"
                                        title="Vehicle exceeds 100,000 KM"
                                    >
                                        <span className="text-[10px] text-red-500 font-mono font-black">
                                            HIGH MILEAGE
                                        </span>
                                    </div>
                                ) : (
                                    (() => {
                                        const end = calculateEndWarranty(formData.startWarranty);
                                        const remain = calculateRemainingTime(end);
                                        const isExpired = remain === "Expired";
                                        return (
                                            <div
                                                className={cn(
                                                    "h-8 px-3 rounded-lg border flex items-center justify-center overflow-hidden shadow-inner uppercase tracking-tighter",
                                                    isExpired
                                                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                                                )}
                                            >
                                                <span className="text-[10px] font-mono font-black truncate">
                                                    {remain || "--"}
                                                </span>
                                            </div>
                                        );
                                    })()
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right side: indicators + submit */}
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {formData.repairSystem === "ضمان" && isHighMileage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 cursor-help transition-all hover:bg-orange-500/20">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                Ineligible
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="bg-[#1c1c1f] border-white/10 text-orange-200 text-[10px] p-2 max-w-[200px]"
                                    >
                                        Vehicle exceeds 100,000 KM limitation.
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {hasValidationErrors && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 transition-all cursor-default"
                            >
                                <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                    {Object.values(partValidationWarnings).length === 1
                                        ? Object.values(partValidationWarnings)[0].type ===
                                            "duplicate"
                                            ? "The order already exists"
                                            : `(name is "${Object.values(partValidationWarnings)[0].value}")`
                                        : `(${Object.values(partValidationWarnings).length} Mismatched Names)`}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="button"
                        className={cn(
                            "h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]",
                            isEditMode
                                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10",
                        )}
                        onClick={onSubmit}
                    >
                        {isEditMode
                            ? isMultiSelection
                                ? "Confirm Batch"
                                : "Confirm"
                            : "Publish"}
                        <CheckCircle2 className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            </div>
        </DialogFooter>
    );
};
