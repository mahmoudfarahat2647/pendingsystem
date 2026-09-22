import { describe, expect, it } from "vitest";
import { resolveValidationMessageKey } from "@/locales";
import { BeastModeSchema, OrderFormSchema } from "@/schemas/form.schema";

/**
 * Proves the centralized compatibility mapping (`src/locales/validationMessages.ts`)
 * stays in sync with the real, locale-agnostic Zod schemas (#268) — it runs
 * the actual schemas against invalid input and asserts every message they
 * can produce resolves to a *specific* catalog key, never silently falling
 * back to `validation.generic`. A schema message that drifts from the map
 * (renamed, reworded, or a new rule added) fails this test rather than
 * silently degrading to the generic fallback in production.
 */

const VALID_ORDER_FORM = {
	customerName: "Jane Doe",
	vin: "VF1TESTVIN000001",
	mobile: "0123456789",
	cntrRdg: "1000",
	model: "Clio V",
	repairSystem: "Mechanical",
	sabNumber: "SAB-1",
	company: "Zeekr",
	requester: "Branch 1",
	acceptedBy: "Agent 1",
};

function collectMessages(result: {
	success: false;
	error: { issues: { message: string }[] };
}) {
	return result.error.issues.map((issue) => issue.message);
}

describe("resolveValidationMessageKey mapping parity with the real schemas", () => {
	it("maps every OrderFormSchema required-field message to a specific key", () => {
		const result = OrderFormSchema.safeParse({
			customerName: "",
			vin: "",
			mobile: "",
			cntrRdg: "",
			company: "",
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const messages = collectMessages(result);
		expect(messages.length).toBeGreaterThan(0);
		for (const message of messages) {
			expect(resolveValidationMessageKey(message)).not.toBe(
				"validation.generic",
			);
		}
	});

	it("maps the warranty-mileage-exceeded business rule", () => {
		const result = OrderFormSchema.safeParse({
			...VALID_ORDER_FORM,
			repairSystem: "ضمان",
			cntrRdg: "150000",
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const messages = collectMessages(result);
		expect(messages).toContain(
			"Ineligible for Warranty: Vehicle exceeds 100,000 KM",
		);
		expect(
			resolveValidationMessageKey(
				"Ineligible for Warranty: Vehicle exceeds 100,000 KM",
			),
		).toBe("validation.warrantyMileageExceeded");
	});

	it("maps the invalid-company business rule", () => {
		const result = OrderFormSchema.safeParse({
			...VALID_ORDER_FORM,
			company: "NotAllowed",
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const messages = collectMessages(result);
		expect(messages).toContain(
			"Invalid company. Only Zeekr and Renault are allowed",
		);
		expect(
			resolveValidationMessageKey(
				"Invalid company. Only Zeekr and Renault are allowed",
			),
		).toBe("validation.invalidCompany");
	});

	it("maps every BeastModeSchema required-field message to a specific key", () => {
		const result = BeastModeSchema.safeParse({
			customerName: "",
			vin: "",
			mobile: "",
			cntrRdg: "",
			model: "",
			repairSystem: "",
			sabNumber: "",
			company: "",
			requester: "",
			acceptedBy: "",
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const messages = collectMessages(result);
		expect(messages.length).toBeGreaterThan(0);
		for (const message of messages) {
			expect(resolveValidationMessageKey(message)).not.toBe(
				"validation.generic",
			);
		}
	});

	it("falls back to the generic key for an unrecognized message, never blank", () => {
		expect(resolveValidationMessageKey("Some future rule text")).toBe(
			"validation.generic",
		);
		expect(resolveValidationMessageKey(undefined)).toBe("validation.generic");
		expect(resolveValidationMessageKey(null)).toBe("validation.generic");
		expect(resolveValidationMessageKey("")).toBe("validation.generic");
	});
});
