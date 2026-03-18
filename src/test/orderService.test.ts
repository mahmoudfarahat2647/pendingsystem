import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../lib/supabase";
import { orderService } from "../services/orderService";

// Mock Supabase client
vi.mock("../lib/supabase", () => ({
	supabase: {
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			single: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
		})),
	},
}));

describe("orderService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should fetch orders for a specific stage", async () => {
		const mockData = [{ id: "1", stage: "main" }];
		// biome-ignore lint/suspicious/noExplicitAny: Mocking Supabase client
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue(
			{
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			},
		);

		const result = await orderService.getOrders("main");

		expect(supabase.from).toHaveBeenCalledWith("orders");
		expect(result).toEqual(mockData);
	});

	it("should fallback to legacy select when attachment columns are missing", async () => {
		const missingColumnError = {
			code: "PGRST204",
			message:
				"Could not find the 'attachment_file_path' column of 'orders' in the schema cache",
			details: null,
			hint: null,
		};
		const mockData = [{ id: "1", stage: "orders", metadata: {} }];
		const initialOrder = vi
			.fn()
			.mockResolvedValue({ data: null, error: missingColumnError });
		const fallbackOrder = vi
			.fn()
			.mockResolvedValue({ data: mockData, error: null });

		(supabase.from as unknown as { mockReturnValueOnce: Function })
			.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				order: initialOrder,
			})
			.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				order: fallbackOrder,
			});

		const result = await orderService.getOrders();

		expect(result).toEqual(mockData);
		expect(supabase.from).toHaveBeenCalledTimes(2);
	});

	it("should update order stage", async () => {
		const mockData = { id: "1", stage: "archive" };
		// biome-ignore lint/suspicious/noExplicitAny: Mocking Supabase client
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue(
			{
				update: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			},
		);

		const result = await orderService.updateOrderStage("1", "archive");

		expect(result).toEqual(mockData);
	});

	it("should fallback to metadata save when attachment columns are missing", async () => {
		const missingColumnError = {
			code: "PGRST204",
			message:
				"Could not find the 'attachment_file_path' column of 'orders' in the schema cache",
			details: null,
			hint: null,
		};
		const firstInsert = vi.fn().mockReturnThis();
		const secondInsert = vi.fn().mockReturnThis();

		(supabase.from as unknown as { mockReturnValueOnce: Function })
			.mockReturnValueOnce({
				insert: firstInsert,
				select: vi.fn().mockReturnThis(),
				single: vi
					.fn()
					.mockResolvedValue({ data: null, error: missingColumnError }),
			})
			.mockReturnValueOnce({
				insert: secondInsert,
				select: vi.fn().mockReturnThis(),
				single: vi.fn().mockResolvedValue({
					data: { id: "new-order-id", metadata: {} },
					error: null,
				}),
			});

		const result = await orderService.saveOrder({
			id: "",
			stage: "orders",
			attachmentLink: "C:\\files\\quote.pdf",
			attachmentFilePath: "orders/new-order-id/quote.pdf",
			customerName: "John",
		});

		expect(result).toEqual({ id: "new-order-id", metadata: {} });
		expect(firstInsert).toHaveBeenCalledWith([
			expect.objectContaining({
				attachment_link: "C:\\files\\quote.pdf",
				attachment_file_path: "orders/new-order-id/quote.pdf",
			}),
		]);
		expect(secondInsert).toHaveBeenCalledWith([
			expect.objectContaining({
				metadata: expect.objectContaining({
					attachmentLink: "C:\\files\\quote.pdf",
					attachmentFilePath: "orders/new-order-id/quote.pdf",
				}),
			}),
		]);
		expect(secondInsert.mock.calls[0][0][0]).not.toHaveProperty(
			"attachment_link",
		);
		expect(secondInsert.mock.calls[0][0][0]).not.toHaveProperty(
			"attachment_file_path",
		);
	});

	it("should delete an order with valid UUID", async () => {
		const mockId = "123e4567-e89b-42d3-a456-426614174000"; // Valid v4 UUID
		// biome-ignore lint/suspicious/noExplicitAny: Mocking Supabase client
		const mockDelete = vi.fn().mockReturnThis();
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue(
			{
				delete: mockDelete,
				eq: mockEq,
			},
		);

		await orderService.deleteOrder(mockId);

		// Then delete the order
		expect(supabase.from).toHaveBeenCalledWith("orders");
	});

	it("should map Supabase row to PendingRow correctly", () => {
		const supabaseRow = {
			id: "1",
			order_number: "T1",
			customer_name: "John",
			customer_phone: "123",
			vin: "VF1AB000123456789", // 17 characters
			company: "R",
			attachment_link: "C:\\files\\quote.pdf",
			attachment_file_path: "orders/1/quote.pdf",
			metadata: {
				partNumber: "P1",
				description: "D1",
				model: "Clio", // Required field
			},
			order_reminders: [
				{
					title: "Call",
					remind_at: "2024-01-01T10:00:00Z",
					is_completed: false,
				},
			],
		};

		const result = orderService.mapSupabaseOrder(supabaseRow);

		expect(result).not.toBeNull();
		if (!result) {
			throw new Error("Expected mapped row");
		}

		expect(result.id).toBe("1");
		expect(result.trackingId).toBe("T1");
		expect(result.customerName).toBe("John");
		expect(result.partNumber).toBe("P1");
		expect(result.reminder?.subject).toBe("Call");
		expect(result.attachmentLink).toBe("C:\\files\\quote.pdf");
		expect(result.attachmentFilePath).toBe("orders/1/quote.pdf");
		expect(result.hasAttachment).toBe(true);
	});

	it("should return null for invalid mapped row", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const invalidRow = {
			id: "", // Invalid because PendingRowSchema requires id.min(1)
			order_number: "T2",
			customer_name: "",
			customer_phone: "",
			vin: "",
			metadata: {},
		};

		const result = orderService.mapSupabaseOrder(invalidRow);

		expect(result).toBeNull();
		expect(warnSpy).toHaveBeenCalledWith(
			"[orderService.mapSupabaseOrder] validation_failed",
			expect.objectContaining({ orderId: "" }),
		);

		warnSpy.mockRestore();
	});

	describe("checkHistoricalVinPartDuplicate", () => {
		it("should detect duplicate VIN + part combination", async () => {
			const mockData = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "Orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			(
				supabase.from as unknown as { mockReturnValue: Function }
			).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			});

			const result = await orderService.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
			);

			expect(result.isDuplicate).toBe(true);
			expect(result.existingRow?.id).toBe("row-1");
		});

		it("should exclude only specific rowId in multi-edit mode", async () => {
			const mockData = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "Orders",
					metadata: { partNumber: "PART-A" },
				},
				{
					id: "row-2",
					vin: "VIN123456789",
					stage: "Main Sheet",
					metadata: { partNumber: "PART-B" },
				},
			];
			(
				supabase.from as unknown as { mockReturnValue: Function }
			).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			});

			const result = await orderService.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
				"row-2",
			);

			expect(result.isDuplicate).toBe(true);
			expect(result.existingRow?.id).toBe("row-1");
		});

		it("should not flag current row as duplicate when excluded", async () => {
			const mockData = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "Orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			(
				supabase.from as unknown as { mockReturnValue: Function }
			).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			});

			const result = await orderService.checkHistoricalVinPartDuplicate(
				"VIN123456789",
				"PART-A",
				"row-1",
			);

			expect(result.isDuplicate).toBe(false);
		});

		it("should return no duplicate for unique VIN + part combination", async () => {
			const mockData = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "Orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			(
				supabase.from as unknown as { mockReturnValue: Function }
			).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			});

			const result = await orderService.checkHistoricalVinPartDuplicate(
				"VIN999999999",
				"PART-Z",
			);

			expect(result.isDuplicate).toBe(false);
		});
	});
});
