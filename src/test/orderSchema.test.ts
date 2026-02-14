import { describe, expect, it } from "vitest";
import { PendingRowSchema } from "@/schemas/order.schema";

describe("PendingRowSchema - Array Field Handling", () => {
	it("should validate string fields correctly", () => {
		const validData = {
			id: "test-id",
			customerName: "John Doe",
			mobile: "1234567890",
			model: "Toyota Camry",
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customerName).toBe("John Doe");
			expect(result.data.mobile).toBe("1234567890");
			expect(result.data.model).toBe("Toyota Camry");
		}
	});

	it("should handle customerName as array and convert to string", () => {
		const dataWithArrayCustomerName = {
			id: "test-id",
			customerName: ["John Doe"], // Array format
			mobile: "1234567890",
			model: "Toyota Camry",
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithArrayCustomerName);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customerName).toBe("John Doe");
		}
	});

	it("should handle empty array for customerName", () => {
		const dataWithEmptyArray = {
			id: "test-id",
			customerName: [], // Empty array
			mobile: "1234567890",
			model: "Toyota Camry",
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithEmptyArray);
		expect(result.success).toBe(false);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			expect(fieldErrors.customerName).toBeDefined();
			expect(fieldErrors.customerName?.[0]).toBe("Customer name is required");
		}
	});

	it("should allow empty string for model", () => {
		const dataWithEmptyModel = {
			id: "test-id",
			customerName: "John Doe",
			mobile: "1234567890",
			model: "", // Empty string
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithEmptyModel);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.model).toBe("");
		}
	});

	it("should handle mobile as array and convert to string", () => {
		const dataWithArrayMobile = {
			id: "test-id",
			customerName: "John Doe",
			mobile: ["1234567890"], // Array format
			model: "Toyota Camry",
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithArrayMobile);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.mobile).toBe("1234567890");
		}
	});

	it("should handle model as array and convert to string", () => {
		const dataWithArrayModel = {
			id: "test-id",
			customerName: "John Doe",
			mobile: "1234567890",
			model: ["Toyota Camry"], // Array format
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithArrayModel);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.model).toBe("Toyota Camry");
		}
	});

	it("should handle multiple array fields simultaneously", () => {
		const dataWithMultipleArrays = {
			id: "test-id",
			customerName: ["John Doe"], // Array
			mobile: ["1234567890"], // Array
			model: ["Toyota Camry"], // Array
			vin: "VIN123",
			company: "Test Company",
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithMultipleArrays);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customerName).toBe("John Doe");
			expect(result.data.mobile).toBe("1234567890");
			expect(result.data.model).toBe("Toyota Camry");
		}
	});

	it("should handle null values gracefully", () => {
		const dataWithNulls = {
			id: "test-id",
			customerName: null,
			mobile: null,
			model: null,
			vin: "VIN123",
			company: null,
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithNulls);
		expect(result.success).toBe(false);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			expect(fieldErrors.customerName).toBeDefined();
			expect(fieldErrors.mobile).toBeDefined();
			// model is no longer in fieldErrors because it succeeds and returns ""
			expect(fieldErrors.model).toBeUndefined();
		}
	});

	it("should handle undefined values gracefully", () => {
		const dataWithUndefined = {
			id: "test-id",
			customerName: undefined,
			mobile: undefined,
			model: undefined,
			vin: "VIN123",
			company: undefined,
			parts: [],
			stage: "orders",
		};

		const result = PendingRowSchema.safeParse(dataWithUndefined);
		expect(result.success).toBe(false);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			expect(fieldErrors.customerName).toBeDefined();
			expect(fieldErrors.mobile).toBeDefined();
			// model is no longer in fieldErrors because it succeeds and returns ""
			expect(fieldErrors.model).toBeUndefined();
		}
	});

	it("should handle complex nested data with array fields", () => {
		const complexData = {
			id: "test-id",
			customerName: ["John Doe Smith"], // Array
			mobile: ["+1234567890"], // Array with country code
			model: ["2023 Toyota Camry LE"], // Array with year and trim
			vin: "1HGCM82633A123456",
			company: "ABC Auto Repair",
			parts: [
				{
					id: "part-1",
					partNumber: "12345",
					description: "Engine Oil Filter",
					rowId: "row-1",
				},
			],
			stage: "orders",
			trackingId: "TRK-12345",
			cntrRdg: 1500,
			sabNumber: "SAB-67890",
			acceptedBy: "John Smith",
			requester: "Jane Doe",
			repairSystem: "System A",
			startWarranty: "2024-01-01",
			endWarranty: "2025-01-01",
			remainTime: "12 months",
			noteContent: "Customer requested priority service",
			actionNote: "Follow up with customer",
			bookingDate: "2024-02-15",
			bookingNote: "Morning appointment",
			bookingStatus: "Confirmed",
			hasAttachment: true,
			attachmentPath: "/uploads/attachment.pdf",
			reminder: {
				date: "2024-01-20",
				time: "10:00",
				subject: "Follow up call",
			},
			archiveReason: "Completed",
			archivedAt: "2024-01-25",
			sourceType: "Manual",
		};

		const result = PendingRowSchema.safeParse(complexData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customerName).toBe("John Doe Smith");
			expect(result.data.mobile).toBe("+1234567890");
			expect(result.data.model).toBe("2023 Toyota Camry LE");
			expect(result.data.parts).toHaveLength(1);
			expect(result.data.parts[0].partNumber).toBe("12345");
		}
	});
});
