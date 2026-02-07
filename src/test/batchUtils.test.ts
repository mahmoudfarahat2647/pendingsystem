import { describe, expect, it } from "vitest";
import { processBatch } from "../lib/batchUtils";

describe("batchUtils", () => {
	it("should process items in batches", async () => {
		const items = [1, 2, 3, 4, 5];
		const batchSize = 2;
		const batches: number[][] = [];

		const result = await processBatch(items, batchSize, async (batch) => {
			batches.push(batch);
			return batch.map((x) => x * 10);
		});

		expect(batches).toEqual([[1, 2], [3, 4], [5]]);
		expect(result).toEqual([10, 20, 30, 40, 50]);
	});

	it("should return empty array for empty input", async () => {
		const result = await processBatch([], 2, async (batch) => batch);
		expect(result).toEqual([]);
	});
});
