import { normalizeCompanyName } from "@/lib/company";
import { generateId } from "@/lib/utils";
import type { PartEntry, PendingRow } from "@/types";
import type { FormData } from "../../types";

/** Builds the initial FormData from the first selected row (edit mode) or returns defaults. */
export function buildInitialFormData(first: PendingRow): FormData {
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
			first.startWarranty ||
			(first.repairSystem === "ضمان"
				? new Date().toISOString().split("T")[0]
				: ""),
		requester: first.requester || "",
		sabNumber: first.sabNumber || "",
		acceptedBy: first.acceptedBy || "",
		company: normalizeCompanyName(first.company) || "",
		rDate: first.rDate || new Date().toISOString().split("T")[0],
	};
}

/** Builds the default empty FormData. */
export function buildEmptyFormData(): FormData {
	return {
		customerName: "",
		vin: "",
		mobile: "",
		cntrRdg: "",
		model: "",
		repairSystem: "",
		startWarranty: "",
		requester: "",
		sabNumber: "",
		acceptedBy: "",
		company: "",
		rDate: new Date().toISOString().split("T")[0],
	};
}

/** Builds the initial parts list from all selected rows (edit mode). */
export function buildInitialParts(selectedRows: PendingRow[]): PartEntry[] {
	return selectedRows.map((row) => ({
		id: generateId(),
		partNumber: row.partNumber || "",
		description: row.description || "",
		rowId: row.id,
	}));
}
