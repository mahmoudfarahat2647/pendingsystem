"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeCompanyName } from "@/lib/company";
import {
    ALLOWED_COMPANIES,
    DEFAULT_COMPANY,
    ValidationMode,
} from "@/lib/ordersValidationConstants";
import {
    checkDescriptionConflict,
    checkVinPartDuplicate,
    findSameOrderDuplicateIndices,
    shouldSkipDuplicateCheck,
} from "@/lib/orderWorkflow";
import {
    calculateEndWarranty,
    calculateRemainingTime,
    cn,
    detectModelFromVin,
    generateId,
} from "@/lib/utils";
import { BeastModeSchema, OrderFormSchema } from "@/schemas/form.schema";
import { orderService } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";
import type { FormData } from "../types";

// ---------------------------------------------------------------------------
// Inline helpers — not exported, only used by this hook
// ---------------------------------------------------------------------------

/** Builds the initial FormData from the first selected row (edit mode) or returns defaults. */
function buildInitialFormData(first: PendingRow): FormData {
    return {
        customerName: first.customerName || "",
        vin: first.vin || "",
        mobile: first.mobile || "",
        cntrRdg:
            first.cntrRdg !== null && first.cntrRdg !== undefined
                ? String(first.cntrRdg)
                : "",
        model: first.model || "",
        repairSystem: first.repairSystem || "",
        startWarranty:
            first.startWarranty || new Date().toISOString().split("T")[0],
        requester: first.requester || "",
        sabNumber: first.sabNumber || "",
        acceptedBy: first.acceptedBy || "",
        company: normalizeCompanyName(first.company) || DEFAULT_COMPANY,
    };
}

/** Builds the default empty FormData. */
function buildEmptyFormData(): FormData {
    return {
        customerName: "",
        vin: "",
        mobile: "",
        cntrRdg: "",
        model: "",
        repairSystem: "",
        startWarranty: new Date().toISOString().split("T")[0],
        requester: "",
        sabNumber: "",
        acceptedBy: "",
        company: DEFAULT_COMPANY,
    };
}

/** Builds the initial parts list from all selected rows (edit mode). */
function buildInitialParts(selectedRows: PendingRow[]): PartEntry[] {
    return selectedRows.map((row) => ({
        id: generateId(),
        partNumber: row.partNumber || "",
        description: row.description || "",
        rowId: row.id,
    }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseOrderFormOptions {
    open: boolean;
    isEditMode: boolean;
    selectedRows: PendingRow[];
    onSubmit: (formData: FormData, parts: PartEntry[]) => void;
}

/**
 * Manages all state, effects, and handlers for the order form modal.
 * Bulk-import UI state is intentionally left to sub-components.
 */
export const useOrderForm = ({
    open,
    isEditMode,
    selectedRows,
    onSubmit,
}: UseOrderFormOptions) => {
    // Store selectors
    const rowData = useAppStore((state) => state.rowData);
    const ordersRowData = useAppStore((state) => state.ordersRowData);
    const callRowData = useAppStore((state) => state.callRowData);
    const bookingRowData = useAppStore((state) => state.bookingRowData);
    const archiveRowData = useAppStore((state) => state.archiveRowData);
    const beastModeTriggers = useAppStore((state) => state.beastModeTriggers);
    const setCurrentEditVin = useAppStore((state) => state.setCurrentEditVin);
    const clearCurrentEditVin = useAppStore(
        (state) => state.clearCurrentEditVin,
    );

    // Core form state
    const [formData, setFormData] = useState<FormData>(buildEmptyFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
        {},
    );

    // Validation state
    const [validationMode, setValidationMode] = useState<"easy" | "beast">(
        "easy",
    );
    const [beastModeTimer, setBeastModeTimer] = useState<number | null>(null);
    const [beastModeErrors, setBeastModeErrors] = useState<Set<string>>(
        new Set(),
    );

    // Parts state
    const [parts, setParts] = useState<PartEntry[]>([
        { id: generateId(), partNumber: "", description: "" },
    ]);
    const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Refs that let the VIN debounce effect always read the latest parts and
    // duplicate-check function without adding them to the effect's dep array
    // (which would cancel the timer on every parts mutation).
    // Initialized with safe defaults; synced in effects placed after the
    // function declarations so there is no forward-reference issue.
    const partsRef = useRef<PartEntry[]>([]);
    const checkDuplicateForPartRef = useRef<
        (partId: string, vin: string, partNumber: string) => Promise<void>
    >(async () => undefined);

    // Duplicate warning state
    const [duplicateWarning, setDuplicateWarning] = useState<{
        location: string;
        vin: string;
        partNumber: string;
    } | null>(null);

    const [asyncDuplicateWarnings, setAsyncDuplicateWarnings] = useState<
        Record<string, { location: string; vin: string; partNumber: string } | null>
    >({});
    const [_isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

    // Derived
    const isMultiSelection = selectedRows.length > 1;
    const isHighMileage = (parseInt(formData.cntrRdg, 10) || 0) >= 100000;

    // -----------------------------------------------------------------------
    // Effect: modal open/close initialisation
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (open) {
            let initialFormData: FormData;
            if (isEditMode && selectedRows.length > 0) {
                const first = selectedRows[0];
                initialFormData = buildInitialFormData(first);

                const initialParts = buildInitialParts(selectedRows);
                setParts(initialParts);
                setFormData(initialFormData);

                if (first.vin) {
                    setCurrentEditVin(first.vin, first.id);
                }

                // CRITICAL: BEAST MODE SYNC - TIMER PERSISTENCE
                // 1. Check for Active Global Timer (from Commit failure)
                const triggerTime = beastModeTriggers[first.id];
                const now = Date.now();
                let remainingGlobalTime = 0;

                if (triggerTime) {
                    const elapsed = Math.floor((now - triggerTime) / 1000);
                    if (elapsed < 30) {
                        remainingGlobalTime = 30 - elapsed;
                    }
                }

                if (remainingGlobalTime > 0) {
                    // Open in Beast Mode with remaining time
                    setValidationMode("beast");
                    setBeastModeTimer(remainingGlobalTime);
                    // Re-validate to show errors immediately
                    const result = BeastModeSchema.safeParse(initialFormData);
                    if (!result.success) {
                        const fieldErrors = new Set(
                            Object.keys(result.error.flatten().fieldErrors),
                        );
                        setBeastModeErrors(fieldErrors);
                    }
                } else {
                    // 2. Auto-trigger Beast Mode ONLY if explicit validation fails AND no timer expired
                    // (Actually user requested: "if >30s, just see easy mode")
                    setValidationMode("easy");
                    setBeastModeErrors(new Set());
                    setBeastModeTimer(null);
                }
            } else {
                setFormData(buildEmptyFormData());
                setParts([{ id: generateId(), partNumber: "", description: "" }]);
                setValidationMode("easy");
                setBeastModeErrors(new Set());
                setBeastModeTimer(null);
                setDuplicateWarning(null);
                setAsyncDuplicateWarnings({});
            }
        } else {
            clearCurrentEditVin();
        }
    }, [open, isEditMode, selectedRows, beastModeTriggers, setCurrentEditVin, clearCurrentEditVin]);

    // -----------------------------------------------------------------------
    // Effect: VIN → model auto-detection
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (formData.vin.length >= 6) {
            const detectedValue = detectModelFromVin(formData.vin);
            if (detectedValue && !formData.model) {
                setFormData((prev) => ({ ...prev, model: detectedValue }));
            }
        }
    }, [formData.vin, formData.model]);

    // -----------------------------------------------------------------------
    // Effect: debounced async duplicate check when VIN changes
    // -----------------------------------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.vin.length >= 6) {
                for (const part of partsRef.current) {
                    if (part.partNumber.trim()) {
                        checkDuplicateForPartRef.current(part.id, formData.vin, part.partNumber);
                    }
                }
            }
        }, 800);
        return () => clearTimeout(timer);
        // Intentional: this effect is the VIN-change debounce only.
        // Parts-change duplicate checks are handled per-row by the onBlur of each part input.
    }, [formData.vin]);

    // -----------------------------------------------------------------------
    // Effect: beast mode countdown timer
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (validationMode !== "beast") return;

        const timer = setInterval(() => {
            setBeastModeTimer((prev) => {
                if (prev === null || prev <= 1) {
                    setValidationMode("easy");
                    setBeastModeErrors(new Set());
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [validationMode]);

    // -----------------------------------------------------------------------
    // Computed: part validation warnings
    // -----------------------------------------------------------------------
    const partValidationWarnings = useMemo(() => {
        const warnings: Record<
            string,
            {
                type: "mismatch" | "duplicate" | "same-order-duplicate";
                value: string;
                location?: string;
            }
        > = {};

        const allRows = [
            ...rowData,
            ...ordersRowData,
            ...callRowData,
            ...bookingRowData,
            ...archiveRowData,
        ];

        const duplicateIndices = findSameOrderDuplicateIndices(parts);

        parts.forEach((part, index) => {
            if (!part.partNumber) return;

            if (duplicateIndices.includes(index)) {
                warnings[part.id] = {
                    type: "same-order-duplicate",
                    value: "Duplicate part number in this order",
                };
                return;
            }

            if (!formData.vin) return;

            const _upperVin = formData.vin.toUpperCase();
            const _upperPart = part.partNumber.toUpperCase();

            if (
                !shouldSkipDuplicateCheck(
                    formData.vin,
                    validationMode === "beast"
                        ? ValidationMode.BEAST
                        : ValidationMode.DEFAULT,
                )
            ) {
                const duplicateResult = checkVinPartDuplicate(
                    formData.vin,
                    part.partNumber,
                    allRows,
                    part.rowId,
                );

                if (duplicateResult.isDuplicate) {
                    warnings[part.id] = {
                        type: "duplicate",
                        value: "The order already exists",
                        location: duplicateResult.location,
                    };
                    return;
                }
            }

            const conflictResult = checkDescriptionConflict(
                part.partNumber,
                part.description,
                allRows,
                part.rowId,
            );

            if (conflictResult.hasConflict) {
                warnings[part.id] = {
                    type: "mismatch",
                    value: conflictResult.existingDescription || "",
                };
            }

            // Merge async database warnings if present and no memory duplicate found
            const asyncWarning = asyncDuplicateWarnings[part.id];
            if (!warnings[part.id] && asyncWarning) {
                warnings[part.id] = {
                    type: "duplicate",
                    value: "The order already exists (DB)",
                    location: asyncWarning.location,
                };
            }
        });
        return warnings;
    }, [
        parts,
        rowData,
        ordersRowData,
        callRowData,
        bookingRowData,
        archiveRowData,
        formData.vin,
        validationMode,
        asyncDuplicateWarnings,
    ]);

    const hasValidationErrors = Object.keys(partValidationWarnings).length > 0;

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    /**
     * Returns whether a field has an active validation error,
     * respecting the current validation mode.
     */
    const getFieldError = (fieldName: keyof FormData): boolean => {
        if (validationMode === "beast") {
            return beastModeErrors.has(fieldName);
        }
        return errors[fieldName] !== undefined;
    };

    const _validateForm = () => {
        const result = OrderFormSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const newErrors: Partial<Record<keyof FormData, string>> = {};
            for (const [key, messages] of Object.entries(fieldErrors)) {
                // Type assertion needed because Object.entries returns string keys
                newErrors[key as keyof FormData] = messages?.[0] || "";
            }
            setErrors(newErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleAddPartRow = () => {
        setParts((prev) => [...prev, { id: generateId(), partNumber: "", description: "" }]);
    };

    const handleRemovePartRow = (id: string) => {
        setParts((prev) => prev.filter((p) => p.id !== id));
    };

    const handlePartChange = (
        id: string,
        field: keyof PartEntry,
        value: string,
    ) => {
        setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const handleBulkImportParts = (newParts: PartEntry[]) => {
        setParts((prev) => {
            if (prev.length === 1 && !prev[0].partNumber && !prev[0].description) {
                // Replace the empty placeholder row
                return newParts;
            }
            // Append to existing
            return [...prev, ...newParts];
        });
    };

    /**
     * Async Database-Backed Duplicate Check.
     * Augments the in-memory check by querying Supabase directly.
     */
    const checkDuplicateForPart = async (
        partId: string,
        vin: string,
        partNumber: string,
    ) => {
        if (!vin || !partNumber || vin.length < 6) {
            setAsyncDuplicateWarnings((prev) => ({ ...prev, [partId]: null }));
            return;
        }

        try {
            setIsCheckingDuplicates(true);
            const result = await orderService.checkHistoricalVinPartDuplicate(
                vin,
                partNumber,
                isEditMode ? selectedRows.map((r) => r.id) : undefined,
            );

            if (result.isDuplicate) {
                setAsyncDuplicateWarnings((prev) => ({
                    ...prev,
                    [partId]: {
                        location: result.location || "unknown",
                        vin,
                        partNumber,
                    },
                }));
            } else {
                setAsyncDuplicateWarnings((prev) => ({ ...prev, [partId]: null }));
            }
        } catch (error) {
            console.error("Error checking duplicate:", error);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    // Keep refs current so the VIN debounce effect always reads the latest values.
    // These effects must live after the function/state declarations they reference.
    useEffect(() => {
        partsRef.current = parts;
    }, [parts]);

    useEffect(() => {
        checkDuplicateForPartRef.current = checkDuplicateForPart;
    }, [checkDuplicateForPart]);

    /**
     * Validates and submits the form, respecting the current validation mode
     * (easy/draft vs beast/commit).
     */
    const handleLocalSubmit = async () => {
        // Beast mode is activated externally by the grid toolbar Commit button (triggerBeastMode).
        // The form's own Commit/Publish buttons are always permissive (draft saves).
        const isBeastMode = validationMode === "beast";

        if (isBeastMode) {
            const result = BeastModeSchema.safeParse(formData);

            if (!result.success) {
                setValidationMode("beast");
                setBeastModeTimer(30);

                const fieldErrors = result.error.flatten().fieldErrors;
                const missingFields = new Set<string>();
                for (const key of Object.keys(fieldErrors)) {
                    missingFields.add(key);
                }
                setBeastModeErrors(missingFields);

                toast.error("Missing Info: Please complete the highlighted fields.", {
                    id: "beast-mode-validation-error",
                });
                return;
            }

            if (hasValidationErrors) {
                const hasSameOrderDup = Object.values(partValidationWarnings).some(
                    (w) => w.type === "same-order-duplicate",
                );
                if (hasSameOrderDup) {
                    toast.error(
                        "Duplicate part numbers in this order. Please remove duplicates.",
                    );
                    return;
                }

                const hasVinPartDup = Object.values(partValidationWarnings).some(
                    (w) => w.type === "duplicate",
                );
                if (hasVinPartDup) {
                    toast.error(
                        "This VIN + part combination already exists. Please review.",
                    );
                    return;
                }

                const hasMismatch = Object.values(partValidationWarnings).some(
                    (w) => w.type === "mismatch",
                );
                if (hasMismatch) {
                    toast.error(
                        "Description conflicts must be resolved. Please use the existing description.",
                    );
                    return;
                }
            }
            // Beast mode: require at least one part with both partNumber AND description
            const hasValidPart = parts.some(
                (p) => p.partNumber.trim() !== "" && p.description.trim() !== "",
            );
            if (!hasValidPart) {
                toast.error(
                    "Part number and description are required. Please complete the components section.",
                );
                return;
            }
        } else {
            // Draft Mode (Publish): permissive — save whatever data is entered.
            // Only block on same-order duplicate part numbers (data integrity, not validation).
            const hasSameOrderDup = Object.values(partValidationWarnings).some(
                (w) => w.type === "same-order-duplicate",
            );
            if (hasSameOrderDup) {
                toast.error(
                    "Duplicate part numbers in this order. Please remove duplicates.",
                );
                return;
            }

            // Pre-submit async duplicate check for draft mode
            setIsCheckingDuplicates(true);
            try {
                if (formData.vin && formData.vin.length >= 6) {
                    for (const part of parts) {
                        if (!part.partNumber.trim()) continue;

                        const result = await orderService.checkHistoricalVinPartDuplicate(
                            formData.vin,
                            part.partNumber,
                            isEditMode ? selectedRows.map((r) => r.id) : undefined,
                        );

                        if (result.isDuplicate) {
                            setDuplicateWarning({
                                location: result.location || "unknown",
                                vin: formData.vin,
                                partNumber: part.partNumber,
                            });
                            return; // Block submission
                        }
                    }
                }
            } finally {
                setIsCheckingDuplicates(false);
            }

            // Block cross-tab VIN+Part duplicate creation in all modes
            const duplicateError = Object.values(partValidationWarnings).find(
                (w) => w.type === "duplicate",
            );
            if (duplicateError) {
                const offendingPart = parts.find(
                    (p) =>
                        p.id ===
                        Object.keys(partValidationWarnings).find(
                            (key) => partValidationWarnings[key] === duplicateError,
                        ),
                );
                setDuplicateWarning({
                    location: duplicateError.location || "unknown",
                    vin: formData.vin,
                    partNumber: offendingPart?.partNumber || "Unknown",
                });
                return;
            }

            // Note: validateForm object-level schema is not enforced for Draft/Publish Mode.
        }

        onSubmit(
            {
                ...formData,
                company: normalizeCompanyName(formData.company),
            },
            parts,
        );
        clearCurrentEditVin();
    };

    return {
        // Form state
        formData,
        setFormData,
        errors,

        // Validation state
        validationMode,
        beastModeTimer,
        beastModeErrors,
        getFieldError,

        // Parts state
        parts,
        setParts,
        descriptionRefs,

        // Duplicate warning
        duplicateWarning,
        setDuplicateWarning,

        // Derived / computed
        isMultiSelection,
        isHighMileage,
        partValidationWarnings,
        hasValidationErrors,

        // Handlers
        handleAddPartRow,
        handleRemovePartRow,
        handlePartChange,
        handleBulkImportParts,
        checkDuplicateForPart,
        handleLocalSubmit,
    };
};
