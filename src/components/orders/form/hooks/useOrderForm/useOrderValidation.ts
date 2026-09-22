import { useEffect, useMemo, useRef, useState } from "react";
import { ValidationMode } from "@/domain/order/constants";
import {
	checkDescriptionConflict,
	checkVinPartDuplicate,
	findSameOrderDuplicateIndices,
	shouldSkipDuplicateCheck,
} from "@/domain/order/orderWorkflow";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { logger } from "@/lib/logger";
import type { TranslationKey } from "@/locales";
import { resolveValidationMessageKey } from "@/locales";
import { BeastModeSchema, OrderFormSchema } from "@/schemas/form.schema";
import { useAppStore } from "@/store/useStore";
import type { DuplicateCheckResult, PartEntry, PendingRow } from "@/types";
import type { FormData } from "../../types";

interface UseOrderValidationProps {
	formData: FormData;
	parts: PartEntry[];
	isEditMode: boolean;
	selectedRows: PendingRow[];
	checkHistoricalDuplicate: (
		vin: string,
		partNumber: string,
		excludeIds?: string | string[],
	) => Promise<DuplicateCheckResult>;
}

export function useOrderValidation({
	formData,
	parts,
	isEditMode,
	selectedRows: _selectedRows,
	checkHistoricalDuplicate,
}: UseOrderValidationProps) {
	// React Query hooks for live stage data (replaces stale Zustand row arrays)
	const { data: ordersData } = useOrdersQuery("orders");
	const { data: mainData } = useOrdersQuery("main");
	const { data: callData } = useOrdersQuery("call");
	const { data: bookingData } = useOrdersQuery("booking");
	const { data: archiveData } = useOrdersQuery("archive");

	// Store selectors
	const beastModeTriggers = useAppStore((state) => state.beastModeTriggers);

	// Basic errors state. Values are translation keys, not raw message text —
	// re-rendering with a new locale re-translates them without re-validating
	// (#268 acceptance criteria: visible validation messages re-render on
	// locale switch without re-running submission or mutating form state).
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormData, TranslationKey>>
	>({});

	// Validation mode state
	const [validationMode, setValidationMode] = useState<"easy" | "beast">(
		"easy",
	);
	const [beastModeTimer, setBeastModeTimer] = useState<number | null>(null);
	const [beastModeErrors, setBeastModeErrors] = useState<Set<string>>(
		new Set(),
	);

	// Duplicate warning state
	const [duplicateWarning, setDuplicateWarning] = useState<{
		location: string;
		vin: string;
		partNumber: string;
	} | null>(null);

	const [asyncDuplicateWarnings, setAsyncDuplicateWarnings] = useState<
		Record<string, { location: string; vin: string; partNumber: string } | null>
	>({});
	const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

	// Beast mode sync ref
	const beastModeTriggersRef = useRef(beastModeTriggers);
	useEffect(() => {
		beastModeTriggersRef.current = beastModeTriggers;
	}, [beastModeTriggers]);

	// Initialize beast mode timer (called from orchestrator when opening modal)
	const checkBeastModeTimer = (rowId: string, initialFormData: FormData) => {
		const triggerTime = beastModeTriggersRef.current[rowId];
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
			setValidationMode("easy");
			setBeastModeErrors(new Set());
			setBeastModeTimer(null);
		}
	};

	const resetValidation = () => {
		setValidationMode("easy");
		setBeastModeErrors(new Set());
		setBeastModeTimer(null);
		setDuplicateWarning(null);
		setAsyncDuplicateWarnings({});
		setErrors({});
	};

	// Debounce refs exactly matching orchestrator pattern
	const partsRef = useRef<PartEntry[]>([]);
	const checkDuplicateForPartRef = useRef<
		(
			partId: string,
			vin: string,
			partNumber: string,
			rowId?: string,
		) => Promise<void>
	>(async () => undefined);

	// Async duplicate check
	const checkDuplicateForPart = async (
		partId: string,
		vin: string,
		partNumber: string,
		rowId?: string,
	) => {
		if (!vin || !partNumber || vin.length < 6) {
			setAsyncDuplicateWarnings((prev) => ({ ...prev, [partId]: null }));
			return;
		}

		try {
			setIsCheckingDuplicates(true);
			const result = await checkHistoricalDuplicate(
				vin,
				partNumber,
				isEditMode ? rowId : undefined,
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
			logger.error("Error checking duplicate:", error);
		} finally {
			setIsCheckingDuplicates(false);
		}
	};

	useEffect(() => {
		partsRef.current = parts;
	}, [parts]);

	useEffect(() => {
		checkDuplicateForPartRef.current = checkDuplicateForPart;
	}, [checkDuplicateForPart]);

	// Debounced async duplicate check for VIN changes
	useEffect(() => {
		const timer = setTimeout(() => {
			if (formData.vin.length >= 6) {
				for (const part of partsRef.current) {
					if (part.partNumber.trim()) {
						checkDuplicateForPartRef.current(
							part.id,
							formData.vin,
							part.partNumber,
							part.rowId,
						);
					}
				}
			}
		}, 800);
		return () => clearTimeout(timer);
	}, [formData.vin]);

	// Beast mode countdown timer
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

	// Computed: part validation warnings
	const partValidationWarnings = useMemo(() => {
		const warnings: Record<
			string,
			{
				type: "mismatch" | "duplicate" | "same-order-duplicate";
				value: string;
				location?: string;
				// Localized presentation key for the static portion of `value`.
				// Set only when `value` is fixed copy (not "mismatch", whose
				// `value` is another order's actual description — operational
				// data that must stay untranslated). Consumers render
				// `messageKey ? t(messageKey) : value` (#268).
				messageKey?: TranslationKey;
			}
		> = {};

		const allRows: PendingRow[] = [
			...(ordersData ?? []),
			...(mainData ?? []),
			...(callData ?? []),
			...(bookingData ?? []),
			...(archiveData ?? []),
		];

		const duplicateIndices = findSameOrderDuplicateIndices(parts);

		parts.forEach((part, index) => {
			if (!part.partNumber) return;

			if (duplicateIndices.includes(index)) {
				warnings[part.id] = {
					type: "same-order-duplicate",
					value: "Duplicate part number in this order",
					messageKey: "warnings.duplicatePartInOrder",
				};
				return;
			}

			if (!formData.vin) return;

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
						messageKey: "warnings.orderAlreadyExists",
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
					messageKey: "warnings.orderAlreadyExistsDb",
				};
			}
		});
		return warnings;
	}, [
		parts,
		ordersData,
		mainData,
		callData,
		bookingData,
		archiveData,
		formData.vin,
		validationMode,
		asyncDuplicateWarnings,
	]);

	const hasValidationErrors = Object.keys(partValidationWarnings).length > 0;

	const getFieldError = (fieldName: keyof FormData): boolean => {
		if (validationMode === "beast") {
			return beastModeErrors.has(fieldName);
		}
		return errors[fieldName] !== undefined;
	};

	const validateForm = () => {
		const result = OrderFormSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			const newErrors: Partial<Record<keyof FormData, TranslationKey>> = {};
			for (const [key, messages] of Object.entries(fieldErrors)) {
				newErrors[key as keyof FormData] = resolveValidationMessageKey(
					messages?.[0],
				);
			}
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	return {
		errors,
		setErrors,
		validationMode,
		setValidationMode,
		beastModeTimer,
		setBeastModeTimer,
		beastModeErrors,
		setBeastModeErrors,
		duplicateWarning,
		setDuplicateWarning,
		isCheckingDuplicates,
		setIsCheckingDuplicates,
		checkBeastModeTimer,
		resetValidation,
		checkDuplicateForPart,
		partValidationWarnings,
		hasValidationErrors,
		getFieldError,
		validateForm,
	};
}
