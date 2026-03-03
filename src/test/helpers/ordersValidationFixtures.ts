import type { ValidationMode as ValidationModeType } from "@/lib/ordersValidationConstants";
import {
	ALLOWED_COMPANIES,
	DUPLICATE_CHECK_VIN_MIN_LENGTH,
	ValidationMode,
	VIN_MIN_LENGTH,
	VIN_STANDARD_LENGTH,
} from "@/lib/ordersValidationConstants";
import type { PartEntry, PendingRow } from "@/types";

export const createMockFormData = (
	overrides: Partial<{
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
	}> = {},
) => ({
	customerName: "",
	vin: "",
	mobile: "",
	cntrRdg: "",
	model: "",
	repairSystem: "Mechanical",
	startWarranty: new Date().toISOString().split("T")[0],
	requester: "",
	sabNumber: "",
	acceptedBy: "",
	company: "Zeekr",
	...overrides,
});

export const createMockPartEntry = (
	overrides: Partial<PartEntry> = {},
): PartEntry => ({
	id: "test-id-1",
	partNumber: "",
	description: "",
	...overrides,
});

export const createMockPendingRow = (
	overrides: Partial<PendingRow> = {},
): PendingRow => ({
	id: "test-row-id-1",
	baseId: "base-test-id-1",
	trackingId: "TRACK001",
	customerName: "Test Customer",
	vin: "VF1ABC12345678901",
	mobile: "0123456789",
	cntrRdg: 50000,
	model: "Megane IV",
	repairSystem: "Mechanical",
	startWarranty: new Date().toISOString().split("T")[0],
	endWarranty: "",
	remainTime: "",
	requester: "Test Branch",
	sabNumber: "SAB001",
	acceptedBy: "Test Agent",
	company: "Zeekr",
	parts: [
		{
			id: "part-1",
			partNumber: "PART001",
			description: "Test Part Description",
		},
	],
	partNumber: "PART001",
	description: "Test Part Description",
	stage: "orders",
	status: "Pending",
	rDate: "",
	...overrides,
});

export const validationTestCases = {
	validDefaultMode: {
		formData: createMockFormData({
			customerName: "John Doe",
			vin: "VF1",
			mobile: "0123456789",
			model: "Megane IV",
		}),
		parts: [createMockPartEntry({ partNumber: "P1", description: "Desc 1" })],
		mode: ValidationMode.DEFAULT,
	},
	partialVinDefaultMode: {
		formData: createMockFormData({
			customerName: "John Doe",
			vin: "VF1AB",
			mobile: "0123456789",
			company: "Zeekr",
		}),
		parts: [createMockPartEntry({ partNumber: "P1", description: "Desc 1" })],
		mode: ValidationMode.DEFAULT,
	},
	completeVinBeastMode: {
		formData: createMockFormData({
			customerName: "John Doe",
			vin: "VF1ABC12345678901",
			mobile: "0123456789",
			cntrRdg: "50000",
			model: "Megane IV",
			repairSystem: "Mechanical",
			sabNumber: "SAB001",
			requester: "Branch A",
			acceptedBy: "Agent 1",
			company: "Zeekr",
		}),
		parts: [createMockPartEntry({ partNumber: "P1", description: "Desc 1" })],
		mode: ValidationMode.BEAST,
	},
	invalidBeastMode: {
		formData: createMockFormData({
			customerName: "",
			vin: "",
			mobile: "",
			model: "",
		}),
		parts: [createMockPartEntry({ partNumber: "", description: "" })],
		mode: ValidationMode.BEAST,
	},
	duplicateVinPart: {
		existingRow: createMockPendingRow({
			vin: "VF1ABC12345678901",
			partNumber: "PART001",
		}),
		newFormData: createMockFormData({
			vin: "VF1ABC12345678901",
		}),
		newPart: createMockPartEntry({ partNumber: "PART001" }),
	},
	descriptionConflict: {
		existingRow: createMockPendingRow({
			partNumber: "PART001",
			description: "Original Description",
		}),
		newPart: createMockPartEntry({
			partNumber: "PART001",
			description: "Different Description",
		}),
	},
	companyOptions: ALLOWED_COMPANIES,
	vinMinLength: VIN_MIN_LENGTH,
	vinStandardLength: VIN_STANDARD_LENGTH,
	duplicateCheckVinMinLength: DUPLICATE_CHECK_VIN_MIN_LENGTH,
};

export const createDuplicateOrderScenario = (
	existingRows: PendingRow[],
	vin: string,
	partNumber: string,
): boolean => {
	const upperVin = vin.toUpperCase();
	const upperPart = partNumber.toUpperCase();
	return existingRows.some(
		(row) =>
			row.vin?.toUpperCase() === upperVin &&
			row.partNumber?.toUpperCase() === upperPart,
	);
};

export const createDescriptionConflictScenario = (
	existingRows: PendingRow[],
	partNumber: string,
	currentDescription: string,
): string | null => {
	const upperPart = partNumber.toUpperCase();
	const existingRow = existingRows.find(
		(row) => row.partNumber?.toUpperCase() === upperPart,
	);
	if (
		existingRow &&
		existingRow.description &&
		existingRow.description.trim().toLowerCase() !==
			currentDescription.trim().toLowerCase()
	) {
		return existingRow.description;
	}
	return null;
};

export const createSameOrderDuplicateScenario = (
	parts: PartEntry[],
): PartEntry[] => {
	const seen = new Map<string, PartEntry>();
	const duplicates: PartEntry[] = [];

	for (const part of parts) {
		const key = part.partNumber.toUpperCase();
		if (key && seen.has(key)) {
			duplicates.push(part);
		} else {
			seen.set(key, part);
		}
	}

	return duplicates;
};
