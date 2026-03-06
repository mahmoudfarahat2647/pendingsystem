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
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue({
			select: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
		});

		const result = await orderService.getOrders("main");

		expect(supabase.from).toHaveBeenCalledWith("orders");
		expect(result).toEqual(mockData);
	});

	it("should update order stage", async () => {
		const mockData = { id: "1", stage: "archive" };
		// biome-ignore lint/suspicious/noExplicitAny: Mocking Supabase client
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue({
			update: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
		});

		const result = await orderService.updateOrderStage("1", "archive");

		expect(result).toEqual(mockData);
	});

	it("should delete an order with valid UUID", async () => {
		const mockId = "123e4567-e89b-42d3-a456-426614174000"; // Valid v4 UUID
		// biome-ignore lint/suspicious/noExplicitAny: Mocking Supabase client
		const mockDelete = vi.fn().mockReturnThis();
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		(supabase.from as unknown as { mockReturnValue: Function }).mockReturnValue({
			delete: mockDelete,
			eq: mockEq,
		});

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
	});

	it("should return null for invalid mapped row", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

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
});
