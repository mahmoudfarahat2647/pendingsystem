import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../lib/supabase";
import { createOrderQueryRepository } from "../services/order/orderQueryRepository";
import { createOrderRepository } from "../services/orderRepository";
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
		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
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

		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
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
		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
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

		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
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
			})
			// Third call: re-fetch to include order_reminders join
			.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				maybeSingle: vi.fn().mockResolvedValue({
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
		const mockDelete = vi.fn().mockReturnThis();
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
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

	it("should auto-migrate legacy single attachment_file_path into attachmentFilePaths array", () => {
		const supabaseRow = {
			id: "2",
			order_number: "T2",
			customer_name: "Jane",
			customer_phone: "456",
			vin: "VF1AB000123456790",
			company: null,
			attachment_link: null,
			attachment_file_path: "orders/2/legacy.pdf",
			attachment_file_paths: [],
			metadata: { model: "Megane" },
			order_reminders: [],
		};

		const result = orderService.mapSupabaseOrder(supabaseRow);
		expect(result).not.toBeNull();
		expect(result?.attachmentFilePaths).toEqual(["orders/2/legacy.pdf"]);
		expect(result?.hasAttachment).toBe(true);
	});

	it("should use attachment_file_paths array when present and non-empty", () => {
		const supabaseRow = {
			id: "3",
			order_number: "T3",
			customer_name: "Bob",
			customer_phone: "789",
			vin: "VF1AB000123456791",
			company: null,
			attachment_link: null,
			attachment_file_path: "orders/3/old.pdf",
			attachment_file_paths: ["orders/3/file1.pdf", "orders/3/file2.pdf"],
			metadata: { model: "Clio" },
			order_reminders: [],
		};

		const result = orderService.mapSupabaseOrder(supabaseRow);
		expect(result).not.toBeNull();
		expect(result?.attachmentFilePaths).toEqual([
			"orders/3/file1.pdf",
			"orders/3/file2.pdf",
		]);
		expect(result?.hasAttachment).toBe(true);
	});

	it("should throw for invalid mapped row", () => {
		const invalidRow = {
			id: "", // Invalid because PendingRowSchema requires id.min(1)
			order_number: "T2",
			customer_name: "",
			customer_phone: "",
			vin: "",
			metadata: {},
		};

		expect(() => orderService.mapSupabaseOrder(invalidRow)).toThrow(
			"[orderMapper] Row mapping failed for id=",
		);
	});

	describe("checkHistoricalVinPartDuplicate", () => {
		it("should detect duplicate VIN + part combination", async () => {
			const mockData = [
				{
					id: "row-1",
					vin: "VIN123456789",
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			// biome-ignore lint/suspicious/noExplicitAny: Test mock typing
			(supabase.from as any).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
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
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
				{
					id: "row-2",
					vin: "VIN123456789",
					stage: "main",
					metadata: { partNumber: "PART-B" },
				},
			];
			// biome-ignore lint/suspicious/noExplicitAny: Test mock typing
			(supabase.from as any).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
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
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			// biome-ignore lint/suspicious/noExplicitAny: Test mock typing
			(supabase.from as any).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
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
					stage: "orders",
					metadata: { partNumber: "PART-A" },
				},
			];
			// biome-ignore lint/suspicious/noExplicitAny: Test mock typing
			(supabase.from as any).mockReturnValue({
				select: vi.fn().mockReturnThis(),
				ilike: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			});

			const result = await orderService.checkHistoricalVinPartDuplicate(
				"VIN999999999",
				"PART-Z",
			);

			expect(result.isDuplicate).toBe(false);
		});
	});

	describe("saveOrder – noteHistory key purges legacy fields", () => {
		const VALID_UUID = "123e4567-e89b-42d3-a456-426614174000";

		function makeSupabaseMock({
			existingMetadata,
			savedData,
		}: {
			existingMetadata: Record<string, unknown>;
			savedData: Record<string, unknown>;
		}) {
			const mockUpdate = vi.fn().mockReturnThis();
			const mockSingle = vi
				.fn()
				.mockResolvedValue({ data: savedData, error: null });
			const mockEq = vi.fn().mockReturnThis();
			const mockSelect = vi.fn().mockReturnThis();
			const mockMaybeSingle = vi.fn().mockResolvedValue({
				data: { metadata: existingMetadata },
				error: null,
			});

			// biome-ignore lint/suspicious/noExplicitAny: Test mock typing
			(supabase.from as any).mockReturnValue({
				select: mockSelect,
				eq: mockEq,
				maybeSingle: mockMaybeSingle,
				update: mockUpdate,
				single: mockSingle,
			});

			return { mockUpdate };
		}

		it("should strip actionNote from metadata when noteHistory is explicitly saved as ''", async () => {
			const { mockUpdate } = makeSupabaseMock({
				existingMetadata: { actionNote: "old note" },
				savedData: { id: VALID_UUID },
			});

			await orderService.saveOrder({
				id: VALID_UUID,
				stage: "main",
				noteHistory: "",
			});

			const writtenMetadata = mockUpdate.mock.calls[0][0].metadata;
			expect(writtenMetadata).not.toHaveProperty("actionNote");
		});

		it("should strip noteContent from metadata when noteHistory is explicitly saved as ''", async () => {
			const { mockUpdate } = makeSupabaseMock({
				existingMetadata: { noteContent: "old content" },
				savedData: { id: VALID_UUID },
			});

			await orderService.saveOrder({
				id: VALID_UUID,
				stage: "main",
				noteHistory: "",
			});

			const writtenMetadata = mockUpdate.mock.calls[0][0].metadata;
			expect(writtenMetadata).not.toHaveProperty("noteContent");
		});

		it("should preserve existing actionNote when payload does NOT include noteHistory", async () => {
			const { mockUpdate } = makeSupabaseMock({
				existingMetadata: { actionNote: "old note" },
				savedData: { id: VALID_UUID },
			});

			await orderService.saveOrder({
				id: VALID_UUID,
				stage: "main",
				customerName: "Jane",
				// noteHistory intentionally absent
			});

			const writtenMetadata = mockUpdate.mock.calls[0][0].metadata;
			expect(writtenMetadata).toHaveProperty("actionNote", "old note");
		});

		it("should NOT overwrite attachment_link when attachmentLink is absent from updates", async () => {
			const { mockUpdate } = makeSupabaseMock({
				existingMetadata: { attachmentLink: "C:\\files\\existing.pdf" },
				savedData: { id: VALID_UUID },
			});

			await orderService.saveOrder({
				id: VALID_UUID,
				stage: "booking",
				noteHistory: "moved to booking",
				// attachmentLink intentionally absent
			});

			const writtenPayload = mockUpdate.mock.calls[0][0];
			expect(writtenPayload).not.toHaveProperty("attachment_link");
			expect(writtenPayload).not.toHaveProperty("attachment_file_path");
		});
	});

	describe("createOrderRepository – injected client", () => {
		it("calls db.from('orders') with the injected client and returns data", async () => {
			const mockData = [{ id: "x", stage: "main" }];
			const chainable: Record<string, unknown> = {};
			chainable.select = vi.fn().mockReturnValue(chainable);
			chainable.order = vi.fn().mockReturnValue(chainable);
			chainable.eq = vi.fn().mockResolvedValue({ data: mockData, error: null });
			const mockFrom = vi.fn().mockReturnValue(chainable);
			const mockDb = { from: mockFrom } as unknown as Parameters<
				typeof createOrderQueryRepository
			>[0];

			const svc = createOrderQueryRepository(mockDb);
			const result = await svc.getOrders("main");

			expect(mockFrom).toHaveBeenCalledWith("orders");
			expect(result).toEqual(mockData);
		});

		it("uses the real supabase client when no db is injected", () => {
			expect(() => createOrderRepository()).not.toThrow();
		});
	});
});
