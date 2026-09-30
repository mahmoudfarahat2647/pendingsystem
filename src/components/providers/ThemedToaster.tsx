"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export function ThemedToaster() {
	const { theme } = useTheme();
	return (
		<Toaster
			position="bottom-right"
			richColors
			theme={theme === "white" ? "light" : "dark"}
		/>
	);
}
