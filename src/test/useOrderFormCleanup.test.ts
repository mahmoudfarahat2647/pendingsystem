import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrderForm } from "../components/orders/form/hooks/useOrderForm/useOrderForm";
import type { PendingRow } from "../types";

const mocks = vi.hoisted(() => ({
	storeState: {
		rowData: [] as PendingRow[],
		ordersRowData: [] as PendingRow[],
		callRowData: [] as PendingRow[],
		bookingRowData: [] as PendingRow[],
		archiveRowData: [] as PendingRow[],
		beastModeTriggers: {} as Record<string, number>,
		setCurrentEditVin: vi.fn(),
		clearCurrentEditVin: vi.fn(),
	},
	checkBeastModeTimer: vi.fn(),
	handleLocalSubmit: vi.fn(),
}));

vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (state: typeof mocks.storeState) => unknown) =>
		selector(mocks.storeState),
}));

vi.mock("../components/orders/form/hooks/useOrderFormState", () => ({
	useOrderFormState: () => ({
		formData: { vin: "VIN123" },
		setFormData: vi.fn(),
		isMultiSelection: false,
		isHighMileage: false,
	}),
}));

vi.mock("../components/orders/form/hooks/useOrderForm/useOrderParts", () => ({
	useOrderParts: () => ({
		parts: [],
		setParts: vi.fn(),
		descriptionRefs: { current: {} },
		handleAddPartRow: vi.fn(),
		handleRemovePartRow: vi.fn(),
		handlePartChange: vi.fn(),
		handleBulkImportParts: vi.fn(),
	}),
}));

vi.mock(
	"../components/orders/form/hooks/useOrderForm/useOrderValidation",
	() => ({
		useOrderValidation: () => ({
			errors: {},
			validationMode: "easy" as const,
			setValidationMode: vi.fn(),
			beastModeTimer: null,
			setBeastModeTimer: vi.fn(),
			beastModeErrors: new Set<string>(),
			setBeastModeErrors: vi.fn(),
			duplicateWarning: null,
			setDuplicateWarning: vi.fn(),
			setIsCheckingDuplicates: vi.fn(),
			checkBeastModeTimer: mocks.checkBeastModeTimer,
			resetValidation: vi.fn(),
			checkDuplicateForPart: vi.fn(),
			partValidationWarnings: {},
			hasValidationErrors: false,
			getFieldError: vi.fn(),
		}),
	}),
);

vi.mock("../components/orders/form/hooks/useOrderForm/useOrderSubmit", () => ({
	useOrderSubmit: () => ({
		handleLocalSubmit: mocks.handleLocalSubmit,
	}),
}));

vi.mock("../components/orders/form/hooks/useOrderForm/orderFormUtils", () => ({
	buildEmptyFormData: () => ({ vin: "" }),
	buildInitialFormData: () => ({ vin: "VIN123" }),
	buildInitialParts: () => [],
}));

describe("useOrderForm cleanup", () => {
	beforeEach(() => {
		mocks.storeState.setCurrentEditVin.mockReset();
		mocks.storeState.clearCurrentEditVin.mockReset();
		mocks.checkBeastModeTimer.mockReset();
	});

	it("clears the active edit VIN when the form unmounts while still open", () => {
		const selectedRows = [{ id: "row-1", vin: "VIN123" }] as PendingRow[];

		const { unmount } = renderHook(() =>
			useOrderForm({
				open: true,
				isEditMode: true,
				selectedRows,
				onSubmit: vi.fn(),
			}),
		);

		expect(mocks.storeState.setCurrentEditVin).toHaveBeenCalledWith(
			"VIN123",
			"row-1",
		);

		unmount();

		expect(mocks.storeState.clearCurrentEditVin).toHaveBeenCalledTimes(1);
	});
});
