import { useEffect, useState } from "react";
import { detectModelFromVin } from "@/lib/utils";
import type { PendingRow } from "@/types";
import type { FormData } from "../types";
import { buildEmptyFormData } from "./useOrderForm/orderFormUtils";

export function useOrderFormState(selectedRows: PendingRow[]) {
	// Core form state
	const [formData, setFormData] = useState<FormData>(buildEmptyFormData());

	// Derived
	const isMultiSelection = selectedRows.length > 1;
	const isHighMileage = (parseInt(formData.cntrRdg, 10) || 0) >= 100000;

	// Effect: VIN → model auto-detection
	useEffect(() => {
		if (formData.vin.length >= 6) {
			const detectedValue = detectModelFromVin(formData.vin);
			if (detectedValue && !formData.model) {
				setFormData((prev) => ({ ...prev, model: detectedValue }));
			}
		}
	}, [formData.vin, formData.model]);

	return {
		formData,
		setFormData,
		isMultiSelection,
		isHighMileage,
	};
}
