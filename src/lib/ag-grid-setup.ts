import { themeQuartz } from "ag-grid-community";
import type { Theme } from "@/lib/theme";

// Define the custom theme based on Quartz
export const gridThemeDark = themeQuartz.withParams({
	accentColor: "#FFCC00", // pendingsystem yellow
	backgroundColor: "#0a0a0b",
	foregroundColor: "#ffffff",
	borderColor: "rgba(255, 255, 255, 0.08)",
	browserColorScheme: "dark",
	headerBackgroundColor: "#141416",
	rowHoverColor: "rgba(255, 204, 0, 0.05)",
	selectedRowBackgroundColor: "rgba(255, 204, 0, 0.1)",
	fontFamily: "inherit",
	fontSize: 13,
	headerFontWeight: 600,
	wrapperBorderRadius: 8,
});

export const gridThemeWhite = themeQuartz.withParams({
	accentColor: "#FFCC00",
	backgroundColor: "#ffffff",
	foregroundColor: "#0a0a0b",
	borderColor: "rgba(0, 0, 0, 0.1)",
	browserColorScheme: "light",
	headerBackgroundColor: "#f5f5f6",
	rowHoverColor: "rgba(255, 204, 0, 0.08)",
	selectedRowBackgroundColor: "rgba(255, 204, 0, 0.18)",
	fontFamily: "inherit",
	fontSize: 13,
	headerFontWeight: 600,
	wrapperBorderRadius: 8,
});

/** Both grids get the theme via prop, so switching never remounts them. */
export const getGridTheme = (theme: Theme) =>
	theme === "white" ? gridThemeWhite : gridThemeDark;
