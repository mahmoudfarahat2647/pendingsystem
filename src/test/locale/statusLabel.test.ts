import { describe, expect, it } from "vitest";
import {
	BUILT_IN_BOOKING_STATUS_DEFAULTS,
	BUILT_IN_PART_STATUS_DEFAULTS,
} from "@/domain/status/statusDefaults";
import {
	resolveStatusLabel,
	resolveStatusLabelByValue,
} from "@/lib/locale/statusLabel";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";

/**
 * Status label presentation rule (#269):
 * - A built-in status still showing its canonical default label translates.
 * - A built-in status with a customized label renders that text verbatim,
 *   in every locale, byte-for-byte.
 * - A fully custom (operator-created) status is never translated.
 * The rule never mutates the status it is given — only what is *returned*
 * changes; `status.id` and `status.label` are read-only inputs throughout.
 */
describe("resolveStatusLabel", () => {
	it("translates a built-in part status whose label still matches its canonical default", () => {
		for (const status of BUILT_IN_PART_STATUS_DEFAULTS) {
			expect(resolveStatusLabel(status, "en")).toBe(status.label);
		}
		// Arabic mode: Pending -> قيد الانتظار, Hold -> معلق, etc.
		expect(resolveStatusLabel({ id: "no_stats", label: "Pending" }, "ar")).toBe(
			ar.statuses.partStatus.noStats,
		);
		expect(resolveStatusLabel({ id: "hold", label: "Hold" }, "ar")).toBe(
			ar.statuses.partStatus.hold,
		);
		expect(resolveStatusLabel({ id: "arrive", label: "Arrived" }, "ar")).toBe(
			ar.statuses.partStatus.arrive,
		);
	});

	it("translates a built-in booking status whose label still matches its canonical default", () => {
		for (const status of BUILT_IN_BOOKING_STATUS_DEFAULTS) {
			expect(resolveStatusLabel(status, "en")).toBe(status.label);
		}
		expect(
			resolveStatusLabel({ id: "confirmed", label: "Confirmed" }, "ar"),
		).toBe(ar.statuses.bookingStatus.confirmed);
		expect(
			resolveStatusLabel({ id: "completed", label: "Completed" }, "ar"),
		).toBe(ar.statuses.bookingStatus.completed);
	});

	it("renders a customized built-in status label byte-for-byte unchanged in both locales", () => {
		const customizedHold = { id: "hold", label: "On Backorder" };
		expect(resolveStatusLabel(customizedHold, "en")).toBe("On Backorder");
		expect(resolveStatusLabel(customizedHold, "ar")).toBe("On Backorder");

		// Even an operator-entered Arabic string for a built-in id stays verbatim
		// once it no longer equals the canonical English default.
		const operatorArabicLabel = { id: "arrive", label: "وصلت الشحنة" };
		expect(resolveStatusLabel(operatorArabicLabel, "en")).toBe("وصلت الشحنة");
		expect(resolveStatusLabel(operatorArabicLabel, "ar")).toBe("وصلت الشحنة");
	});

	it("never translates a fully custom, operator-created status", () => {
		const customStatus = { id: "abc123x", label: "In Transit" };
		expect(resolveStatusLabel(customStatus, "en")).toBe("In Transit");
		expect(resolveStatusLabel(customStatus, "ar")).toBe("In Transit");
	});

	it("never mutates the status object it receives", () => {
		const status = { id: "hold", label: "Hold" };
		const snapshot = { ...status };
		resolveStatusLabel(status, "ar");
		expect(status).toEqual(snapshot);
	});

	it("falls back to the canonical default translation source, keeping en.ts and the domain defaults in agreement", () => {
		// English catalog values for built-in statuses must equal the domain's
		// canonical default labels, or resolveStatusLabel(..., "en") would
		// silently diverge from the stored default itself.
		expect(en.statuses.partStatus.noStats).toBe("Pending");
		expect(en.statuses.partStatus.hold).toBe("Hold");
		expect(en.statuses.partStatus.reserve).toBe("Reserve");
		expect(en.statuses.partStatus.branch).toBe("Branch");
		expect(en.statuses.partStatus.arrive).toBe("Arrived");
		expect(en.statuses.bookingStatus.confirmed).toBe("Confirmed");
		expect(en.statuses.bookingStatus.pending).toBe("Pending");
		expect(en.statuses.bookingStatus.cancelled).toBe("Cancelled");
		expect(en.statuses.bookingStatus.completed).toBe("Completed");
	});
});

describe("resolveStatusLabelByValue", () => {
	const statuses = [
		...BUILT_IN_PART_STATUS_DEFAULTS,
		{ id: "cust1", label: "VIP" },
	];

	it("resolves a matching built-in default value through translation", () => {
		expect(resolveStatusLabelByValue("Hold", statuses, "ar")).toBe(
			ar.statuses.partStatus.hold,
		);
	});

	it("resolves a matching custom status verbatim", () => {
		expect(resolveStatusLabelByValue("VIP", statuses, "ar")).toBe("VIP");
	});

	it("falls back to the raw value verbatim when nothing matches", () => {
		expect(resolveStatusLabelByValue("Unrecognized", statuses, "ar")).toBe(
			"Unrecognized",
		);
	});
});
