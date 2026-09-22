import type { TranslationKey } from "./types";

/**
 * Centralized compatibility mapping from a Zod validation error's canonical
 * (English) message — the "structured error information" `OrderFormSchema`
 * and `BeastModeSchema` already produce (`src/schemas/form.schema.ts`) — to a
 * localized translation key.
 *
 * Schemas stay locale-agnostic (see CLAUDE.md "Architecture Standards":
 * `schemas/` has no dependency on `lib`/`services`/`store`/UI); this module
 * lives in the presentation-facing `locales/` layer and does the mapping at
 * the boundary where a validation result is rendered, not inside the schema.
 * The literal keys below are intentionally identical to the message strings
 * the schemas emit — `src/test/locale/validationMessageMapping.test.ts`
 * exercises the real schemas and asserts every message they can produce
 * resolves through this map, so drift between the two fails a test rather
 * than silently falling back to the generic copy.
 *
 * A message this map does not recognize (a future schema change, or any
 * other thrown/validation text) resolves to `validation.generic` — never a
 * blank or raw string (#268 acceptance criteria).
 */
const KNOWN_VALIDATION_MESSAGES: Record<string, TranslationKey> = {
	"Customer name is required": "validation.customerNameRequired",
	"VIN is required": "validation.vinRequired",
	"Mobile number is required": "validation.mobileRequired",
	"Invalid mileage format": "validation.invalidMileageFormat",
	"Company is required": "validation.companyRequired",
	"Invalid company. Only Zeekr and Renault are allowed":
		"validation.invalidCompany",
	"Ineligible for Warranty: Vehicle exceeds 100,000 KM":
		"validation.warrantyMileageExceeded",
	"KM reading is required": "validation.kmReadingRequired",
	"Vehicle model is required": "validation.vehicleModelRequired",
	"Repair system is required": "validation.repairSystemRequired",
	"SAB Number is required": "validation.sabNumberRequired",
	"Branch/Requester is required": "validation.requesterRequired",
	"Agent name is required": "validation.acceptedByRequired",
};

/**
 * Resolves a raw Zod/business validation message to its localized catalog
 * key, falling back to `validation.generic` for anything unrecognized.
 * Never throws, never returns a blank key.
 */
export function resolveValidationMessageKey(
	rawMessage: string | undefined | null,
): TranslationKey {
	if (!rawMessage) return "validation.generic";
	return KNOWN_VALIDATION_MESSAGES[rawMessage] ?? "validation.generic";
}
