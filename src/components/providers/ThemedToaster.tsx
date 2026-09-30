"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { isAlwaysDarkPath } from "@/lib/theme";

export function ThemedToaster() {
	const { theme } = useTheme();
	const pathname = usePathname();
	const white = theme === "white" && !isAlwaysDarkPath(pathname ?? "");
	return (
		<Toaster
			position="bottom-right"
			richColors
			theme={white ? "light" : "dark"}
		/>
	);
}
