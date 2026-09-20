import { describe, expect, it } from "vitest";
import {
	filterRowsByValues,
	getModelValue,
	getRepairSystemValue,
	getRowValueFilterOptions,
} from "@/lib/rowValueFilter";
import type { PendingRow } from "@/types";

describe("row value filter — repair system", () => {
	it("builds unique options from existing non-empty repair system values", () => {
		const rows = [
			{ id: "1", repairSystem: "ضمان" },
			{ id: "2", repairSystem: " حفظ حق " },
			{ id: "3", repairSystem: "cash" },
			{ id: "4", repairSystem: "ضمان" },
			{ id: "5", repairSystem: "" },
			{ id: "6" },
		] as PendingRow[];

		expect(getRowValueFilterOptions(rows, getRepairSystemValue)).toEqual([
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

		expect(filterRowsByValues(rows, [], getRepairSystemValue)).toBe(rows);
	});

	it("keeps only rows whose repair system matches the selected values", () => {
		const rows = [
			{ id: "1", repairSystem: "ضمان" },
			{ id: "2", repairSystem: " حفظ حق " },
			{ id: "3", repairSystem: "cash" },
		] as PendingRow[];

		expect(
			filterRowsByValues(rows, ["ضمان", "حفظ حق"], getRepairSystemValue),
		).toEqual([rows[0], rows[1]]);
	});
});

describe("row value filter — car model", () => {
	it("builds unique options from existing non-empty model values", () => {
		const rows = [
			{ id: "1", model: "Megane IV" },
			{ id: "2", model: " Clio V " },
			{ id: "3", model: "Duster" },
			{ id: "4", model: "Megane IV" },
			{ id: "5", model: "" },
			{ id: "6" },
		] as PendingRow[];

		expect(getRowValueFilterOptions(rows, getModelValue)).toEqual([
			{ label: "Megane IV", value: "Megane IV" },
			{ label: "Clio V", value: "Clio V" },
			{ label: "Duster", value: "Duster" },
		]);
	});

	it("returns every row when no model is selected", () => {
		const rows = [
			{ id: "1", model: "Megane IV" },
			{ id: "2", model: "Duster" },
		] as PendingRow[];

		expect(filterRowsByValues(rows, [], getModelValue)).toBe(rows);
	});

	it("keeps only rows whose model matches the selected values", () => {
		const rows = [
			{ id: "1", model: "Megane IV" },
			{ id: "2", model: " Clio V " },
			{ id: "3", model: "Duster" },
		] as PendingRow[];

		expect(
			filterRowsByValues(rows, ["Megane IV", "Clio V"], getModelValue),
		).toEqual([rows[0], rows[1]]);
	});
});
