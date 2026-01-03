import type { ICellRendererParams } from "ag-grid-community";
import type { PartStatusDef, PendingRow } from "@/types";

interface PartStatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const PartStatusRenderer = (params: PartStatusRendererProps) => {
	const value = params.value as string;

	// Enhanced null safety: handle undefined, null, or empty partStatuses array
	const statuses = params.partStatuses || [];

	// Handle empty state or explicit "No Stats" selection
	if (
		!value ||
		(typeof value === "string" && (value.trim() === "" || value === "No Stats"))
	) {
		const noStatsDef = statuses.find((s) => s.id === "no_stats");
		return (
			<div
				className="flex items-center justify-center h-full w-full gap-1"
				title="Select status"
			>
				<span className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">
					{noStatsDef?.label || "No Stats"}
				</span>
			</div>
		);
	}

	// Handle selected state - status is selected
	// Enhanced error handling for missing or invalid status definitions
	let statusDef: PartStatusDef | undefined;
	let colorClass = "bg-gray-400"; // Default fallback color
	let style: React.CSSProperties | undefined;
	let displayValue = value;

	try {
		// Safely find the status definition
		if (Array.isArray(statuses) && statuses.length > 0) {
			statusDef = statuses.find((s: PartStatusDef) => {
				// Additional null safety for individual status objects
				return s && typeof s.label === "string" && s.label === value;
			});
		}

		// Apply color with fallback handling
		if (statusDef?.color && typeof statusDef.color === "string") {
			const trimmedColor = statusDef.color.trim();
			if (trimmedColor.length > 0) {
				// Check if it's a hex color or rgb color
				if (trimmedColor.startsWith("#") || trimmedColor.startsWith("rgb")) {
					colorClass = "";
					style = { backgroundColor: trimmedColor };
				} else {
					colorClass = trimmedColor;
				}
			}
		}

		// Ensure display value is safe
		if (typeof value !== "string") {
			displayValue = String(value || "");
		}
	} catch (_error) {
		colorClass = "bg-gray-400";
		displayValue = String(value || "Unknown");
	}

	return (
		<div
			className="flex items-center justify-center h-full w-full gap-1.5 px-1"
			title={displayValue}
		>
			<div
				className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-sm ring-1 ring-black/10 flex-shrink-0`}
				style={style}
			></div>
		</div>
	);
};
