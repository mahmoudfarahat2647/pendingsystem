"use client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { DuplicateOrderWarningModal } from "../DuplicateOrderWarningModal";
import { FormFooter } from "./FormFooter";
import { FormHeader } from "./FormHeader";
import { IdentityFields } from "./IdentityFields";
import { PartsSection } from "./PartsSection";
import { useOrderForm } from "./hooks/useOrderForm";
import type { OrderFormModalProps } from "./types";

/**
 * Order form modal — thin orchestrator.
 * All state and logic lives in useOrderForm; this component only wires
 * the hook to the Dialog shell and the four UI sub-components.
 */
export const OrderFormModal = ({
    open,
    onOpenChange,
    isEditMode,
    selectedRows,
    onSubmit,
}: OrderFormModalProps) => {
    const {
        formData,
        setFormData,
        errors,
        validationMode,
        beastModeTimer,
        getFieldError,
        parts,
        descriptionRefs,
        duplicateWarning,
        setDuplicateWarning,
        isMultiSelection,
        isHighMileage,
        partValidationWarnings,
        hasValidationErrors,
        handleAddPartRow,
        handleRemovePartRow,
        handlePartChange,
        handleBulkImportParts,
        checkDuplicateForPart,
        handleLocalSubmit,
    } = useOrderForm({ open, isEditMode, selectedRows, onSubmit });

    const handleFieldChange = (updated: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updated }));
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border border-white/5 bg-[#0c0c0e] text-slate-200 shadow-2xl shadow-black/50">
                    <FormHeader
                        isEditMode={isEditMode}
                        isMultiSelection={isMultiSelection}
                        selectedRowsCount={selectedRows.length}
                        validationMode={validationMode}
                        beastModeTimer={beastModeTimer}
                    />

                    <div className="p-5 grid grid-cols-12 gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <IdentityFields
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            errors={errors}
                            getFieldError={getFieldError}
                            isEditMode={isEditMode}
                            validationMode={validationMode}
                        />

                        <PartsSection
                            parts={parts}
                            onAddPart={handleAddPartRow}
                            onRemovePart={handleRemovePartRow}
                            onPartChange={handlePartChange}
                            onBulkImport={handleBulkImportParts}
                            onCheckDuplicate={checkDuplicateForPart}
                            partValidationWarnings={partValidationWarnings}
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            isEditMode={isEditMode}
                            validationMode={validationMode}
                            descriptionRefs={descriptionRefs}
                        />
                    </div>

                    <FormFooter
                        isEditMode={isEditMode}
                        isMultiSelection={isMultiSelection}
                        formData={formData}
                        isHighMileage={isHighMileage}
                        hasValidationErrors={hasValidationErrors}
                        partValidationWarnings={partValidationWarnings}
                        onSubmit={handleLocalSubmit}
                        onCancel={() => onOpenChange(false)}
                    />
                </DialogContent>
            </Dialog>

            <DuplicateOrderWarningModal
                open={!!duplicateWarning}
                onClose={() => setDuplicateWarning(null)}
                location={duplicateWarning?.location || ""}
                vin={duplicateWarning?.vin || ""}
                partNumber={duplicateWarning?.partNumber || ""}
            />
        </>
    );
};
