import type { PartEntry, PendingRow } from "@/types";

export interface FormData {
    customerName: string;
    vin: string;
    mobile: string;
    cntrRdg: string;
    model: string;
    repairSystem: string;
    startWarranty: string;
    requester: string;
    sabNumber: string;
    acceptedBy: string;
    company: string;
}

export interface OrderFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEditMode: boolean;
    selectedRows: PendingRow[];
    onSubmit: (formData: FormData, parts: PartEntry[]) => void;
}

/** Validation warning attached to a single part row. */
export type PartWarning = {
    type: "mismatch" | "duplicate" | "same-order-duplicate";
    value: string;
    location?: string;
};
