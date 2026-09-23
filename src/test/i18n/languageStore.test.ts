import { afterEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/useStore";

const STORAGE_KEY = "pending-sys-storage-v1.1";

type StoreState = ReturnType<typeof useAppStore.getState>;

const partialize = (state: StoreState) =>
	(
		useAppStore as typeof useAppStore & {
			persist: {
				getOptions: () => {
					partialize?: (state: StoreState) => unknown;
				};
			};
		}
	).persist
		.getOptions()
		.partialize?.(state) as { language?: string };

afterEach(() => {
	localStorage.removeItem(STORAGE_KEY);
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

	it("includes language in the persisted snapshot", () => {
		useAppStore.getState().setLanguage("ar");
		expect(partialize(useAppStore.getState()).language).toBe("ar");
	});

	it("keeps English when rehydrating a legacy snapshot without language", async () => {
		// Old localStorage payloads predate the field; rehydration must leave
		// the slice default in place until the user switches.
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ state: {}, version: 1 }),
		);
		await useAppStore.persist.rehydrate();
		expect(useAppStore.getState().language).toBe("en");
	});

	it("restores a persisted Arabic selection on rehydrate", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ state: { language: "ar" }, version: 1 }),
		);
		await useAppStore.persist.rehydrate();
		expect(useAppStore.getState().language).toBe("ar");
	});
});
