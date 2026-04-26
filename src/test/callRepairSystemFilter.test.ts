import { describe, expect, it } from "vitest";
import {
	filterRowsByRepairSystems,
	getRepairSystemFilterOptions,
} from "@/lib/callRepairSystemFilter";
import type { PendingRow } from "@/types";

describe("call repair system filter", () => {
	it("builds unique options from existing non-empty repair system values", () => {
		const rows = [
			{ id: "1", repairSystem: "ضمان" },
			{ id: "2", repairSystem: " حفظ حق " },
			{ id: "3", repairSystem: "cash" },
			{ id: "4", repairSystem: "ضمان" },
			{ id: "5", repairSystem: "" },
			{ id: "6" },
		] as PendingRow[];

		expect(getRepairSystemFilterOptions(rows)).toEqual([
			{ label: "ضمان", value: "ضمان" },
			{ label: "حفظ حق", value: "حفظ حق" },
			{ label: "cash", value: "cash" },
		]);
	});

	it("returns every row when no repair system is selected", () => {
		const rows = [
			{ id: "1", repairSystem: "ضمان" },
			{ id: "2", repairSystem: "cash" },
		] as PendingRow[];

		expect(filterRowsByRepairSystems(rows, [])).toBe(rows);
	});

	it("keeps only rows whose repair system matches the selected values", () => {
		const rows = [
			{ id: "1", repairSystem: "ضمان" },
			{ id: "2", repairSystem: " حفظ حق " },
			{ id: "3", repairSystem: "cash" },
		] as PendingRow[];

		expect(filterRowsByRepairSystems(rows, ["ضمان", "حفظ حق"])).toEqual([
			rows[0],
			rows[1],
		]);
	});
});
