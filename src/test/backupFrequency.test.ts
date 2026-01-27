import { describe, expect, it } from "vitest";

// The logic from scripts/generate-backup.mjs extracted for testing
function shouldRunBackup(frequency: string, cairo: { weekday: string; day: number; month: number }) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (frequency === 'Daily') {
        return true;
    } else if (frequency.startsWith('Weekly-')) {
        const parts = frequency.split('-');
        const selectedDayIndex = parseInt(parts[1]);

        if (isNaN(selectedDayIndex) || selectedDayIndex < 0 || selectedDayIndex > 6) {
            return false;
        }

        const selectedDayName = dayNames[selectedDayIndex];
        return cairo.weekday === selectedDayName;
    } else if (frequency === 'Weekly') {
        return cairo.weekday === 'Monday';
    } else if (frequency === 'Monthly') {
        return cairo.day === 1;
    } else if (frequency === 'Yearly') {
        return cairo.day === 1 && cairo.month === 1;
    }
    return false;
}

describe("Backup Frequency Logic", () => {
    const monday = { weekday: "Monday", day: 19, month: 1 };
    const wednesday = { weekday: "Wednesday", day: 21, month: 1 };
    const firstOfMonth = { weekday: "Tuesday", day: 1, month: 2 };
    const newYears = { weekday: "Thursday", day: 1, month: 1 };

    it("should run every day for 'Daily'", () => {
        expect(shouldRunBackup("Daily", monday)).toBe(true);
        expect(shouldRunBackup("Daily", wednesday)).toBe(true);
    });

    it("should run on correct day for 'Weekly-DayIndex'", () => {
        // Wednesday is index 3
        expect(shouldRunBackup("Weekly-3", wednesday)).toBe(true);
        expect(shouldRunBackup("Weekly-3", monday)).toBe(false);

        // Sunday is index 0
        expect(shouldRunBackup("Weekly-0", { weekday: "Sunday", day: 20, month: 1 })).toBe(true);
        expect(shouldRunBackup("Weekly-0", monday)).toBe(false);
    });

    it("should default to Monday for legacy 'Weekly' format", () => {
        expect(shouldRunBackup("Weekly", monday)).toBe(true);
        expect(shouldRunBackup("Weekly", wednesday)).toBe(false);
    });

    it("should run on the 1st for 'Monthly'", () => {
        expect(shouldRunBackup("Monthly", firstOfMonth)).toBe(true);
        expect(shouldRunBackup("Monthly", monday)).toBe(false);
    });

    it("should run on Jan 1st for 'Yearly'", () => {
        expect(shouldRunBackup("Yearly", newYears)).toBe(true);
        expect(shouldRunBackup("Yearly", firstOfMonth)).toBe(false);
    });

    it("should return false for invalid formats", () => {
        expect(shouldRunBackup("Weekly-9", monday)).toBe(false);
        expect(shouldRunBackup("Bi-Weekly", monday)).toBe(false);
    });
});
