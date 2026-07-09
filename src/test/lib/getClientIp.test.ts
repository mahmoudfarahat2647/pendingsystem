import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/getClientIp";

describe("getClientIp", () => {
	it("prefers x-real-ip even when x-forwarded-for is present and spoofed", () => {
		const headers = new Headers({
			"x-real-ip": "203.0.113.9",
			"x-forwarded-for": "9.9.9.9, 198.51.100.5",
		});
		expect(getClientIp(headers)).toBe("203.0.113.9");
	});

	it("ignores a spoofed first XFF segment and returns the last hop when no x-real-ip is set", () => {
		const headers = new Headers({
			"x-forwarded-for": "1.2.3.4, 10.0.0.1, 198.51.100.5",
		});
		expect(getClientIp(headers)).toBe("198.51.100.5");
	});

	it("returns the single XFF value when there are no commas and no x-real-ip", () => {
		const headers = new Headers({
			"x-forwarded-for": "10.0.0.2",
		});
		expect(getClientIp(headers)).toBe("10.0.0.2");
	});

	it("returns 'unknown' when both headers are missing", () => {
		const headers = new Headers();
		expect(getClientIp(headers)).toBe("unknown");
	});

	it("trims whitespace around header values and XFF segments", () => {
		const withSpacedRealIp = new Headers({
			"x-real-ip": "  203.0.113.9  ",
		});
		expect(getClientIp(withSpacedRealIp)).toBe("203.0.113.9");

		const withSpacedXff = new Headers({
			"x-forwarded-for": "  1.2.3.4  ,  198.51.100.5  ",
		});
		expect(getClientIp(withSpacedXff)).toBe("198.51.100.5");
	});
});
