import { describe, expect, it } from "vitest";
import {
	COMBINED_LIMIT_BYTES,
	DB_LIMIT_BYTES,
	formatBytesToMB,
	STORAGE_LIMIT_BYTES,
	usagePercent,
} from "../lib/storage-limits";

describe("storage-limits", () => {
	describe("constants", () => {
		it("should define DB limit as 500 MB", () => {
			expect(DB_LIMIT_BYTES).toBe(500 * 1024 * 1024);
		});

		it("should define storage limit as 1 GB", () => {
			expect(STORAGE_LIMIT_BYTES).toBe(1 * 1024 * 1024 * 1024);
		});

		it("should define combined limit as DB + Storage", () => {
			expect(COMBINED_LIMIT_BYTES).toBe(DB_LIMIT_BYTES + STORAGE_LIMIT_BYTES);
		});
	});

	describe("formatBytesToMB", () => {
		it("should format 0 bytes", () => {
			expect(formatBytesToMB(0)).toBe("0.00 MB");
		});

		it("should format exactly 1 MB", () => {
			expect(formatBytesToMB(1024 * 1024)).toBe("1.00 MB");
		});

		it("should format fractional MB", () => {
			expect(formatBytesToMB(1_500_000)).toBe("1.43 MB");
		});

		it("should format large values", () => {
			expect(formatBytesToMB(500 * 1024 * 1024)).toBe("500.00 MB");
		});
	});

	describe("usagePercent", () => {
		it("should return 0 when nothing is used", () => {
			expect(usagePercent(0, 1000)).toBe(0);
		});

		it("should return 50 for half usage", () => {
			expect(usagePercent(500, 1000)).toBe(50);
		});

		it("should clamp to 100 when over limit", () => {
			expect(usagePercent(2000, 1000)).toBe(100);
		});

		it("should return 0 when limit is 0", () => {
			expect(usagePercent(500, 0)).toBe(0);
		});

		it("should return 0 when limit is negative", () => {
			expect(usagePercent(500, -100)).toBe(0);
		});
	});
});
