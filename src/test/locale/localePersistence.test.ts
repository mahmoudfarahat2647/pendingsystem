import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "pending-sys-storage-v1.1";

async function freshStore() {
	vi.resetModules();
	const mod = await import("@/store/useStore");
	return mod.useAppStore;
}

describe("locale persistence (real Zustand store + localStorage)", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("defaults to English when nothing is stored", async () => {
		const useAppStore = await freshStore();
		expect(useAppStore.getState().locale).toBe("en");
	});

	it("persists a selected locale and restores it on a fresh store instance (remount)", async () => {
		const firstInstance = await freshStore();
		firstInstance.getState().setLocale("ar");
		expect(firstInstance.getState().locale).toBe("ar");

		// Simulate a remount against the same underlying storage: a brand new
		// module registry, so a brand new Zustand store is created and must
		// rehydrate from the same localStorage entry.
		const secondInstance = await freshStore();
		expect(secondInstance.getState().locale).toBe("ar");
	});

	it("switching back to English persists across a remount too", async () => {
		const firstInstance = await freshStore();
		firstInstance.getState().setLocale("ar");
		firstInstance.getState().setLocale("en");

		const secondInstance = await freshStore();
		expect(secondInstance.getState().locale).toBe("en");
	});

	it("normalizes a malformed locale inside an otherwise-valid current-version snapshot to English, keeping unrelated preferences", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				state: {
					locale: "xx-not-a-real-locale",
					gridEditPermission: true,
					isLocked: false,
				},
				version: 1,
			}),
		);

		const useAppStore = await freshStore();
		const state = useAppStore.getState();
		expect(state.locale).toBe("en");
		expect(state.gridEditPermission).toBe(true);
		expect(state.isLocked).toBe(false);
	});

	it("falls back to English for a legacy v0 snapshot with no locale field, while the v0 part-status migration still runs", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				state: {
					partStatuses: [{ id: "no_stats", label: "Legacy", color: "#fff" }],
					gridEditPermission: true,
				},
				version: 0,
			}),
		);

		const useAppStore = await freshStore();
		const state = useAppStore.getState();
		expect(state.locale).toBe("en");
		// v0 → v1 migration resets partStatuses to the new locked defaults.
		expect(state.partStatuses.find((s) => s.id === "hold")).toBeTruthy();
		expect(state.gridEditPermission).toBe(true);
	});

	it("falls back to English safely when the stored JSON is unreadable, without throwing", async () => {
		localStorage.setItem(STORAGE_KEY, "{not valid json");

		const useAppStore = await freshStore();
		expect(() => useAppStore.getState()).not.toThrow();
		expect(useAppStore.getState().locale).toBe("en");
	});

	it("keeps switching language in memory even when persistence (localStorage.setItem) throws", async () => {
		const useAppStore = await freshStore();
		const spy = vi
			.spyOn(Storage.prototype, "setItem")
			.mockImplementation(() => {
				throw new DOMException("QuotaExceededError");
			});

		expect(() => useAppStore.getState().setLocale("ar")).not.toThrow();
		expect(useAppStore.getState().locale).toBe("ar");

		spy.mockRestore();
	});
});
