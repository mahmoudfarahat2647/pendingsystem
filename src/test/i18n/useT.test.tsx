import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useStore";

afterEach(() => {
	useAppStore.getState().setLanguage("en");
});

describe("useT", () => {
	it("returns English strings with ltr direction by default", () => {
		const { result } = renderHook(() => useT());

		expect(result.current.lang).toBe("en");
		expect(result.current.dir).toBe("ltr");
		expect(result.current.t("common.cancel")).toBe("Cancel");
	});

	it("re-renders Arabic strings with rtl direction after switching", () => {
		const { result } = renderHook(() => useT());

		act(() => {
			useAppStore.getState().setLanguage("ar");
		});

		expect(result.current.lang).toBe("ar");
		expect(result.current.dir).toBe("rtl");
		expect(result.current.t("common.cancel")).toBe("إلغاء");
		expect(result.current.scopeProps).toEqual({ lang: "ar", dir: "rtl" });
	});
});
