"use client";

import { useLayoutEffect } from "react";
import { applyThemeClass, readTheme } from "@/lib/theme";

/**
 * Keeps a route Dark regardless of the saved preference (used by
 * `/mobile-order`). Covers client-side navigation in and out; direct loads
 * are covered by the pre-paint script skipping these paths.
 */
export function ForceDarkTheme() {
	useLayoutEffect(() => {
		applyThemeClass("dark");
		return () => applyThemeClass(readTheme());
	}, []);
	return null;
}
