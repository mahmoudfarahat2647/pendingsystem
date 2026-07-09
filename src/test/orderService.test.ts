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
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
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
		const initialRange = vi
			.fn()
			.mockResolvedValue({ data: null, error: missingColumnError });
		const fallbackRange = vi
			.fn()
			.mockResolvedValue({ data: mockData, error: null });

		// biome-ignore lint/complexity/noBannedTypes: Test mock typing
		(supabase.from as unknown as { mockReturnValueOnce: Function })
			.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: initialRange,
			})
			.mockReturnValueOnce({
				select: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range: fallbackRange,
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

	describe("saveOrder – optimistic concurrency on metadata writes (MAH-11)", () => {
		const VALID_UUID = "123e4567-e89b-42d3-a456-426614174000";

		// Builds a fake Supabase client where each successive `.from("orders")`
		// call resolves the *next* queued { data, error } response, regardless of
		// which chain methods (select/update/eq/order/insert) were called on it.
		// saveOrder always issues exactly one terminal call (maybeSingle/single)
		// per `.from("orders")` invocation, so a flat queue lines up with the
		// sequence of DB round-trips the function makes.
		function makeSequentialDb(
			responses: Array<{ data: unknown; error: unknown }>,
		) {
			let call = 0;
			const from = vi.fn(() => {
				const response = responses[Math.min(call, responses.length - 1)];
				call++;
				// biome-ignore lint/suspicious/noExplicitAny: chainable test mock
				const chain: any = {};
				chain.select = vi.fn(() => chain);
				chain.eq = vi.fn(() => chain);
				chain.update = vi.fn(() => chain);
				chain.order = vi.fn(() => chain);
				chain.insert = vi.fn(() => chain);
				chain.delete = vi.fn(() => chain);
				chain.maybeSingle = vi.fn().mockResolvedValue(response);
				chain.single = vi.fn().mockResolvedValue(response);
				return chain;
			});
			return {
				db: { from } as unknown as Parameters<typeof createOrderRepository>[0],
				callCount: () => call,
			};
		}

		it("writes the merged metadata when no concurrent write occurred", async () => {
			const { db } = makeSequentialDb([
				// 1. initial snapshot read
				{
					data: { metadata: { existingField: "keep" }, updated_at: "t1" },
					error: null,
				},
				// 2. conditional UPDATE succeeds on the first attempt
				{ data: { id: VALID_UUID }, error: null },
				// 3. final re-fetch
				{ data: { id: VALID_UUID }, error: null },
			]);

			const repo = createOrderRepository(db);
			const result = await repo.saveOrder({
				id: VALID_UUID,
				stage: "main",
				customerName: "Jane",
			});

			expect(result).toEqual({ id: VALID_UUID });
		});

		it("re-merges against fresh metadata and retries when a concurrent write is detected", async () => {
			const { db, callCount } = makeSequentialDb([
				// 1. initial snapshot: updated_at "t1"
				{
					data: { metadata: { field: "old" }, updated_at: "t1" },
					error: null,
				},
				// 2. first UPDATE matches 0 rows — another writer changed updated_at
				{ data: null, error: null },
				// 3. recheck: still in the expected stage, but metadata/updated_at moved on
				{
					data: {
						stage: "main",
						metadata: { field: "concurrent-write" },
						updated_at: "t2",
					},
					error: null,
				},
				// 4. retry UPDATE (now guarded on updated_at "t2") succeeds
				{ data: { id: VALID_UUID }, error: null },
				// 5. final re-fetch
				{ data: { id: VALID_UUID }, error: null },
			]);

			const repo = createOrderRepository(db);
			const result = await repo.saveOrder({
				id: VALID_UUID,
				stage: "main",
				expectedCurrentStage: "main",
				customerName: "Jane",
			});

			expect(result).toEqual({ id: VALID_UUID });
			expect(callCount()).toBe(5);
		});

		it("returns null (no throw) when the row legitimately moved to a different stage", async () => {
			const { db } = makeSequentialDb([
				// 1. initial snapshot
				{
					data: { metadata: {}, updated_at: "t1" },
					error: null,
				},
				// 2. conditional UPDATE matches 0 rows
				{ data: null, error: null },
				// 3. recheck shows the row already moved to "archive"
				{
					data: { stage: "archive", metadata: {}, updated_at: "t2" },
					error: null,
				},
			]);

			const repo = createOrderRepository(db);
			const result = await repo.saveOrder({
				id: VALID_UUID,
				stage: "archive",
				expectedCurrentStage: "main",
				customerName: "Jane",
			});

			expect(result).toBeNull();
		});

		it("throws WRITE_CONFLICT after exhausting the retry budget", async () => {
			const staleRecheck = {
				data: {
					stage: "main",
					metadata: { field: "still-racing" },
					updated_at: "t-racing",
				},
				error: null,
			};
			const { db } = makeSequentialDb([
				// 1. initial snapshot
				{ data: { metadata: {}, updated_at: "t0" }, error: null },
				// attempt 1: update misses, recheck says retry
				{ data: null, error: null },
				staleRecheck,
				// attempt 2: update misses, recheck says retry
				{ data: null, error: null },
				staleRecheck,
				// attempt 3: update misses, recheck exhausts the budget -> conflict
				{ data: null, error: null },
				staleRecheck,
			]);

			const repo = createOrderRepository(db);

			await expect(
				repo.saveOrder({
					id: VALID_UUID,
					stage: "main",
					expectedCurrentStage: "main",
					customerName: "Jane",
				}),
			).rejects.toMatchObject({ code: "WRITE_CONFLICT" });
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
			chainable.eq = vi.fn().mockReturnValue(chainable);
			chainable.order = vi.fn().mockReturnValue(chainable);
			chainable.range = vi
				.fn()
				.mockResolvedValue({ data: mockData, error: null });
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

	describe("createOrderQueryRepository – pagination", () => {
		function makePagedDb(range: ReturnType<typeof vi.fn>) {
			const chainable: Record<string, unknown> = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				range,
			};
			return {
				from: vi.fn().mockReturnValue(chainable),
			} as unknown as Parameters<typeof createOrderQueryRepository>[0];
		}

		it("getOrders fetches every page until a short page ends the loop", async () => {
			const firstPage = Array.from({ length: 1000 }, (_, i) => ({
				id: `id-${i}`,
				stage: "archive",
			}));
			const secondPage = [{ id: "id-1000", stage: "archive" }];
			const range = vi.fn((from: number) =>
				Promise.resolve({
					data: from === 0 ? firstPage : secondPage,
					error: null,
				}),
			);

			const svc = createOrderQueryRepository(makePagedDb(range));
			const result = await svc.getOrders("archive");

			expect(result).toHaveLength(1001);
			expect(range).toHaveBeenCalledTimes(2);
			expect(range).toHaveBeenNthCalledWith(1, 0, 999);
			expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
		});

		it("getDashboardStats paginates the same way", async () => {
			const firstPage = Array.from({ length: 1000 }, (_, i) => ({
				id: `id-${i}`,
				vin: null,
				stage: "main",
			}));
			const secondPage = [{ id: "id-1000", vin: null, stage: "call" }];
			const range = vi.fn((from: number) =>
				Promise.resolve({
					data: from === 0 ? firstPage : secondPage,
					error: null,
				}),
			);

			const svc = createOrderQueryRepository(makePagedDb(range));
			const result = await svc.getDashboardStats();

			expect(result).toHaveLength(1001);
			expect(range).toHaveBeenCalledTimes(2);
			expect(range).toHaveBeenNthCalledWith(1, 0, 999);
			expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
		});

		it("getOrders surfaces a non-attachment error via handleSupabaseError", async () => {
			const range = vi.fn().mockResolvedValue({
				data: null,
				error: {
					code: "57014",
					message: "statement timeout",
					details: null,
					hint: null,
				},
			});

			const svc = createOrderQueryRepository(makePagedDb(range));

			await expect(svc.getOrders("archive")).rejects.toThrow(
				"statement timeout",
			);
			expect(range).toHaveBeenCalledTimes(1);
		});
	});
});
