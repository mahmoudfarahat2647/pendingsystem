import { themeQuartz } from "ag-grid-community";

// Define the custom theme based on Quartz
export const gridTheme = themeQuartz.withParams({
	accentColor: "#FFCC00", // Renault yellow
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
