import { describe, expect, it } from "vitest";

// Extract the PUBLIC_PATHS logic by re-implementing the isPublicPath check
// (unit-testing the helper, not the full middleware which requires Edge runtime)
const PUBLIC_PATHS = [
	"/login",
	"/forgot-password",
	"/reset-password",
	"/api/auth",
	"/api/health",
	"/api/password-reset",
	"/mobile-order",
	"/api/mobile-order",
];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);
}

describe("public path matching", () => {
	it("allows /mobile-order", () => {
		expect(isPublicPath("/mobile-order")).toBe(true);
	});
	it("allows /api/mobile-order", () => {
		expect(isPublicPath("/api/mobile-order")).toBe(true);
	});
	it("still blocks /orders", () => {
		expect(isPublicPath("/orders")).toBe(false);
	});
	it("still blocks /dashboard", () => {
		expect(isPublicPath("/dashboard")).toBe(false);
	});
});
