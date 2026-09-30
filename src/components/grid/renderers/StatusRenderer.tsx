import type { ICellRendererParams } from "ag-grid-community";
import { useTheme } from "@/hooks/useTheme";
import type { PartStatusDef, PendingRow } from "@/types";

interface StatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const StatusRenderer = (params: StatusRendererProps) => {
	const { theme } = useTheme();
	const rawValue = (params.value ?? "") as string;
	const value = rawValue || "Pending";
	const statuses = params.partStatuses || [];
	const statusDef = statuses.find(
		(status) =>
			status && typeof status.label === "string" && status.label === value,
	);

	if (statusDef) {
		const isCssColor =
			statusDef.color?.startsWith("#") || statusDef.color?.startsWith("rgb");
		// White only adjusts presentation (tinted chip, darker text); the stored
		// colour itself is never modified and Dark keeps the plain coloured text.
		const whiteChipStyle = {
			color: `color-mix(in srgb, ${statusDef.color} 65%, black)`,
			backgroundColor: `color-mix(in srgb, ${statusDef.color} 14%, transparent)`,
			border: `1px solid color-mix(in srgb, ${statusDef.color} 35%, transparent)`,
			borderRadius: 4,
			padding: "2px 6px",
		};
		const textStyle = isCssColor
			? theme === "white"
				? whiteChipStyle
				: { color: statusDef.color }
			: undefined;

		return (
			<span
				className={`text-[10px] uppercase tracking-wider font-semibold leading-none ${
					isCssColor ? "" : "text-gray-600 dark:text-gray-400"
				}`}
				style={textStyle}
				title={value}
			>
				{value}
			</span>
		);
	}

	const isReorder = value?.toUpperCase() === "REORDER";

	return (
		<span
			className={`text-[10px] uppercase tracking-wider font-semibold ${
				isReorder ? "text-[#d4a017]" : "text-gray-600 dark:text-gray-400"
			}`}
		>
			{value}
		</span>
	);
};
