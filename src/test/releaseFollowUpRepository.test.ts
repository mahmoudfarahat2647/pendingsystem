import { describe, expect, it, vi } from "vitest";
import { createReleaseFollowUpRepository } from "@/services/releaseFollowUpRepository";

function createFakeSupabase() {
	const upsert = vi.fn().mockResolvedValue({ error: null });
	const del = vi.fn().mockReturnValue({
		in: vi.fn().mockResolvedValue({ error: null }),
	});
	const from = vi.fn().mockReturnValue({ upsert, delete: del });
	// biome-ignore lint/suspicious/noExplicitAny: minimal fake matching only the methods the repository calls
	return { db: { from } as any, upsert };
}

describe("releaseFollowUpRepository.upsert", () => {
	it("rejects a blank VIN before touching the client", async () => {
		const { db, upsert } = createFakeSupabase();
		const repo = createReleaseFollowUpRepository(db);

		await expect(repo.upsert("", new Date())).rejects.toThrow(/blank VIN/i);
		expect(upsert).not.toHaveBeenCalled();
	});

	it("writes a valid UUID referenceRowId through unchanged", async () => {
		const { db, upsert } = createFakeSupabase();
		const repo = createReleaseFollowUpRepository(db);
		const validId = "11111111-1111-4111-8111-111111111111";

		await repo.upsert("VF1RFA00000000001", new Date("2026-03-01"), validId);

		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({ reference_row_id: validId }),
			{ onConflict: "vin" },
		);
	});

	it("sanitizes a non-UUID referenceRowId (e.g. a VIN fallback) to null instead of failing", async () => {
		const { db, upsert } = createFakeSupabase();
		const repo = createReleaseFollowUpRepository(db);

		// A caller could pass a VIN string here if it were ever mistakenly
		// used as a row-id fallback (see notificationSlice's referenceId).
		await repo.upsert(
			"VF1RFA00000000001",
			new Date("2026-03-01"),
			"VF1RFA00000000001",
		);

		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({ reference_row_id: null }),
			{ onConflict: "vin" },
		);
	});

	it("passes through a missing referenceRowId as null", async () => {
		const { db, upsert } = createFakeSupabase();
		const repo = createReleaseFollowUpRepository(db);

		await repo.upsert("VF1RFA00000000001", new Date("2026-03-01"));

		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({ reference_row_id: null }),
			{ onConflict: "vin" },
		);
	});
});
