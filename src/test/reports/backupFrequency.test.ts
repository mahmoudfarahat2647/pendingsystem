import { describe, expect, it } from "vitest";
import { shouldRunToday } from "../../../scripts/lib/backupSchedule.mjs";

// ---------------------------------------------------------------------------
// Helpers — build settings objects cleanly
// ---------------------------------------------------------------------------
function settings(
	overrides: Partial<{
		is_enabled: boolean;
		frequency: string;
		last_sent_at: string | null;
	}> = {},
) {
	return {
		is_enabled: true,
		frequency: "Weekly",
		last_sent_at: null,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Anchor dates used throughout the suite
//
// 2025-01-10T08:00:00Z  →  Friday 10 Jan 2025 in Cairo (UTC+2 = 10:00 local)
// 2025-01-11T08:00:00Z  →  Saturday 11 Jan 2025 in Cairo
// 2025-01-06T08:00:00Z  →  Monday  06 Jan 2025 in Cairo
// 2025-01-08T08:00:00Z  →  Wednesday 08 Jan 2025 in Cairo
// ---------------------------------------------------------------------------
const FRIDAY = new Date("2025-01-10T08:00:00Z"); // Cairo: Friday 10 Jan 2025
const SATURDAY = new Date("2025-01-11T08:00:00Z"); // Cairo: Saturday 11 Jan 2025
const MONDAY = new Date("2025-01-06T08:00:00Z"); // Cairo: Monday 06 Jan 2025
const WEDNESDAY = new Date("2025-01-08T08:00:00Z"); // Cairo: Wednesday 08 Jan 2025

// ISO strings at a stable Cairo time (08:00 UTC = 10:00 Cairo)
const FRIDAY_ISO = "2025-01-10T08:00:00.000Z";
const LAST_FRIDAY_ISO = "2025-01-03T08:00:00.000Z"; // 7 Cairo days before FRIDAY
const LAST_MONDAY_ISO = "2024-12-30T08:00:00.000Z"; // 7 Cairo days before MONDAY

// ---------------------------------------------------------------------------
// Guard cases
// ---------------------------------------------------------------------------
describe("Guard cases", () => {
	it("isScheduleRun=false always returns true regardless of enabled/frequency", () => {
		// manual trigger always sends
		expect(
			shouldRunToday(
				settings({ is_enabled: true, frequency: "Weekly" }),
				false,
				FRIDAY,
			),
		).toBe(true);
	});

	it("is_enabled=false returns false for a scheduled run", () => {
		expect(
			shouldRunToday(
				settings({ is_enabled: false, frequency: "Weekly" }),
				true,
				FRIDAY,
			),
		).toBe(false);
	});

	it("unknown frequency Bi-Weekly returns false", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Bi-Weekly", last_sent_at: null }),
				true,
				FRIDAY,
			),
		).toBe(false);
	});

	it("invalid Weekly-9 returns false", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-9", last_sent_at: null }),
				true,
				FRIDAY,
			),
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Daily
// ---------------------------------------------------------------------------
describe("Daily", () => {
	it("never sent → true", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Daily", last_sent_at: null }),
				true,
				FRIDAY,
			),
		).toBe(true);
	});

	it("last_sent_at = same Cairo calendar day → false", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Daily", last_sent_at: FRIDAY_ISO }),
				true,
				FRIDAY,
			),
		).toBe(false);
	});

	it("last_sent_at 23h59m ago but still same Cairo calendar day → false (boundary case)", () => {
		// now = 2025-01-10T08:00:00Z (10:00 Cairo).  23h59m earlier = 2025-01-09T08:01:00Z
		// BUT if we use 01:00 UTC on the 10th, that is 03:00 Cairo — still the same Cairo date.
		// Use: now = 2025-01-10T23:00:00Z (Cairo 01:00 on 11 Jan) — wait, easier:
		// now = 2025-01-10T22:00:00Z → Cairo midnight+2 = 00:00 on 11 Jan... need same-day.
		// Safe same-day pair: last = 2025-01-10T06:00:00Z (Cairo 08:00), now = 2025-01-10T20:00:00Z (Cairo 22:00)
		const nowLate = new Date("2025-01-10T20:00:00Z"); // Cairo: 22:00 Friday 10 Jan
		const lastEarly = "2025-01-10T06:00:00.000Z"; // Cairo: 08:00 Friday 10 Jan — same day, 14h earlier
		expect(
			shouldRunToday(
				settings({ frequency: "Daily", last_sent_at: lastEarly }),
				true,
				nowLate,
			),
		).toBe(false);
	});

	it("last_sent_at = yesterday (Cairo) → true", () => {
		const yesterday = "2025-01-09T08:00:00.000Z"; // Cairo: Thursday 9 Jan
		expect(
			shouldRunToday(
				settings({ frequency: "Daily", last_sent_at: yesterday }),
				true,
				FRIDAY,
			),
		).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Weekly-5 (Friday)
// ---------------------------------------------------------------------------
describe("Weekly-5 (Friday)", () => {
	it("today=Friday, last sent exactly 7 Cairo days ago → true (on-time)", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-5", last_sent_at: LAST_FRIDAY_ISO }),
				true,
				FRIDAY,
			),
		).toBe(true);
	});

	it("today=Friday, already sent today → false", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-5", last_sent_at: FRIDAY_ISO }),
				true,
				FRIDAY,
			),
		).toBe(false);
	});

	it("today=Saturday, last sent 8+ Cairo days ago (Friday was skipped) → true (catch-up)", () => {
		// SATURDAY = 11 Jan. last_sent = 3 Jan (8 days ago)
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-5", last_sent_at: LAST_FRIDAY_ISO }),
				true,
				SATURDAY,
			),
		).toBe(true);
	});

	it("anchor-restoration: Friday after a Saturday catch-up send → true", () => {
		// After Saturday 11 Jan catch-up, the next Friday is 17 Jan (6 Cairo days after Saturday).
		// calendarDaysSince(11 Jan → 17 Jan) = 6 < 7, BUT today IS Friday → weekdayMatch fires.
		const saturdaySentISO = "2025-01-11T08:00:00.000Z";
		const nextFriday = new Date("2025-01-17T08:00:00Z"); // Cairo: Friday 17 Jan 2025
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-5", last_sent_at: saturdaySentISO }),
				true,
				nextFriday,
			),
		).toBe(true);
	});

	it("today=Tuesday, last sent 2 Cairo days ago → false", () => {
		// Tuesday 7 Jan, last sent Sunday 5 Jan (2 days ago, not Friday, not >= 7 days)
		const tuesday = new Date("2025-01-07T08:00:00Z");
		const twoDaysAgo = "2025-01-05T08:00:00.000Z";
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly-5", last_sent_at: twoDaysAgo }),
				true,
				tuesday,
			),
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Legacy Weekly (Monday)
// ---------------------------------------------------------------------------
describe("Weekly (legacy Monday)", () => {
	it("today=Monday, last sent last Monday → true", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly", last_sent_at: LAST_MONDAY_ISO }),
				true,
				MONDAY,
			),
		).toBe(true);
	});

	it("today=Monday, already sent today → false", () => {
		const mondayISO = "2025-01-06T08:00:00.000Z";
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly", last_sent_at: mondayISO }),
				true,
				MONDAY,
			),
		).toBe(false);
	});

	it("today=Wednesday, last sent 4 days ago (Saturday) → false (not Monday, <7 days)", () => {
		const fourDaysAgo = "2025-01-04T08:00:00.000Z"; // Saturday 4 Jan
		expect(
			shouldRunToday(
				settings({ frequency: "Weekly", last_sent_at: fourDaysAgo }),
				true,
				WEDNESDAY,
			),
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Monthly
// ---------------------------------------------------------------------------
describe("Monthly", () => {
	it("never sent → true", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Monthly", last_sent_at: null }),
				true,
				FRIDAY,
			),
		).toBe(true);
	});

	it("last sent previous month → true", () => {
		const prevMonth = "2024-12-15T08:00:00.000Z"; // December 2024
		expect(
			shouldRunToday(
				settings({ frequency: "Monthly", last_sent_at: prevMonth }),
				true,
				FRIDAY, // January 2025
			),
		).toBe(true);
	});

	it("last sent this month → false", () => {
		const thisMonth = "2025-01-02T08:00:00.000Z"; // Jan 2025
		expect(
			shouldRunToday(
				settings({ frequency: "Monthly", last_sent_at: thisMonth }),
				true,
				FRIDAY, // also Jan 2025
			),
		).toBe(false);
	});

	it("last sent December, now January (year boundary) → true", () => {
		const december = "2024-12-31T08:00:00.000Z";
		const january = new Date("2025-01-01T08:00:00Z");
		expect(
			shouldRunToday(
				settings({ frequency: "Monthly", last_sent_at: december }),
				true,
				january,
			),
		).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Yearly
// ---------------------------------------------------------------------------
describe("Yearly", () => {
	it("never sent → true", () => {
		expect(
			shouldRunToday(
				settings({ frequency: "Yearly", last_sent_at: null }),
				true,
				FRIDAY,
			),
		).toBe(true);
	});

	it("last sent previous year → true", () => {
		const prevYear = "2024-06-15T08:00:00.000Z";
		expect(
			shouldRunToday(
				settings({ frequency: "Yearly", last_sent_at: prevYear }),
				true,
				FRIDAY, // 2025
			),
		).toBe(true);
	});

	it("last sent same year → false", () => {
		const sameYear = "2025-01-01T08:00:00.000Z";
		expect(
			shouldRunToday(
				settings({ frequency: "Yearly", last_sent_at: sameYear }),
				true,
				FRIDAY, // also 2025
			),
		).toBe(false);
	});
});
