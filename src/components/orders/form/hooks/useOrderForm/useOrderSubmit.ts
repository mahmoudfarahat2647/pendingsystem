import { toast } from "sonner";
import { normalizeCompanyName } from "@/lib/company";
import { BeastModeSchema } from "@/schemas/form.schema";
import { orderService } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";
import type { FormData } from "../../types";

interface UseOrderSubmitProps {
	formData: FormData;
	parts: PartEntry[];
	validationMode: "easy" | "beast";
	isEditMode: boolean;
	selectedRows: PendingRow[];
	hasValidationErrors: boolean;
	partValidationWarnings: Record<
		string,
		{ type: string; value: string; location?: string }
	>;
	setValidationMode: (mode: "easy" | "beast") => void;
	setBeastModeTimer: (
		timer: number | null | ((prev: number | null) => number | null),
	) => void;
	setBeastModeErrors: (errors: Set<string>) => void;
	setIsCheckingDuplicates: (isChecking: boolean) => void;
	setDuplicateWarning: (
		warning: { location: string; vin: string; partNumber: string } | null,
	) => void;
	onSubmit: (formData: FormData, parts: PartEntry[]) => void;
}

export function useOrderSubmit(props: UseOrderSubmitProps) {
	const clearCurrentEditVin = useAppStore((state) => state.clearCurrentEditVin);

	const handleLocalSubmit = async () => {
		const isBeastMode = props.validationMode === "beast";

		if (isBeastMode) {
			const result = BeastModeSchema.safeParse(props.formData);

			if (!result.success) {
				props.setValidationMode("beast");
				props.setBeastModeTimer(30);

				const fieldErrors = result.error.flatten().fieldErrors;
				const missingFields = new Set<string>();
				for (const key of Object.keys(fieldErrors)) {
					missingFields.add(key);
				}
				props.setBeastModeErrors(missingFields);

				toast.error("Missing Info: Please complete the highlighted fields.", {
					id: "beast-mode-validation-error",
				});
				return;
			}

			if (props.hasValidationErrors) {
				const hasSameOrderDup = Object.values(
					props.partValidationWarnings,
				).some((w) => w.type === "same-order-duplicate");
				if (hasSameOrderDup) {
					toast.error(
						"Duplicate part numbers in this order. Please remove duplicates.",
					);
					return;
				}

				const hasVinPartDup = Object.values(props.partValidationWarnings).some(
					(w) => w.type === "duplicate",
				);
				if (hasVinPartDup) {
					toast.error(
						"This VIN + part combination already exists. Please review.",
					);
					return;
				}

				const hasMismatch = Object.values(props.partValidationWarnings).some(
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
			const hasValidPart = props.parts.some(
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
			const hasSameOrderDup = Object.values(props.partValidationWarnings).some(
				(w) => w.type === "same-order-duplicate",
			);
			if (hasSameOrderDup) {
				toast.error(
					"Duplicate part numbers in this order. Please remove duplicates.",
				);
				return;
			}

			// Pre-submit async duplicate check for draft mode
			props.setIsCheckingDuplicates(true);
			try {
				if (props.formData.vin && props.formData.vin.length >= 6) {
					for (const part of props.parts) {
						if (!part.partNumber.trim()) continue;

						const result = await orderService.checkHistoricalVinPartDuplicate(
							props.formData.vin,
							part.partNumber,
							props.isEditMode ? part.rowId : undefined,
						);

						if (result.isDuplicate) {
							props.setDuplicateWarning({
								location: result.location || "unknown",
								vin: props.formData.vin,
								partNumber: part.partNumber,
							});
							return; // Block submission
						}
					}
				}
			} finally {
				props.setIsCheckingDuplicates(false);
			}

			// Block cross-tab VIN+Part duplicate creation in all modes
			const duplicateError = Object.values(props.partValidationWarnings).find(
				(w) => w.type === "duplicate",
			);
			if (duplicateError) {
				const offendingPart = props.parts.find(
					(p) =>
						p.id ===
						Object.keys(props.partValidationWarnings).find(
							(key) => props.partValidationWarnings[key] === duplicateError,
						),
				);
				props.setDuplicateWarning({
					location: duplicateError.location || "unknown",
					vin: props.formData.vin,
					partNumber: offendingPart?.partNumber || "Unknown",
				});
				return;
			}
		}

		props.onSubmit(
			{
				...props.formData,
				company: normalizeCompanyName(props.formData.company),
			},
			props.parts,
		);
		clearCurrentEditVin();
	};

	return { handleLocalSubmit };
}
