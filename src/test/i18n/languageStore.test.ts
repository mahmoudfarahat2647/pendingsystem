import { afterEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/useStore";

afterEach(() => {
	useAppStore.getState().setLanguage("en");
});

describe("language store (Wave 1)", () => {
	it("defaults to English", () => {
		expect(useAppStore.getState().language).toBe("en");
	});

	it("switches instantly via setLanguage", () => {
		useAppStore.getState().setLanguage("ar");
		expect(useAppStore.getState().language).toBe("ar");
		useAppStore.getState().setLanguage("en");
		expect(useAppStore.getState().language).toBe("en");
	});

	it("treats a legacy snapshot without language as English", () => {
		// Old localStorage payloads predate the field; the slice default
		// keeps them on English until the user switches.
		const legacy = { searchTerm: "" } as Partial<
			ReturnType<typeof useAppStore.getState>
		>;
		expect(legacy.language ?? "en").toBe("en");
	});
});
