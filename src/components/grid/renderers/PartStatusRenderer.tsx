import type { ICellRendererParams } from "ag-grid-community";
import type { PartStatusDef, PendingRow } from "@/types";

interface PartStatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const PartStatusRenderer = (params: PartStatusRendererProps) => {
	const value = params.value as string;
	const statuses = params.partStatuses || [];

	if (
		!value ||
		(typeof value === "string" && value.trim() === "") ||
		(typeof value !== "string" && !String(value).trim())
	) {
		return (
			<div
				className="flex items-center justify-center h-full w-full gap-1"
				title="Select status"
			>
				<span className="text-xs text-gray-500">Select status</span>
				<div className="text-xs text-gray-400 font-bold">▼</div>
			</div>
		);
	}

	let statusDef: PartStatusDef | undefined;
	let colorClass = "bg-gray-400";
	let displayValue = value;

	try {
		if (Array.isArray(statuses) && statuses.length > 0) {
			statusDef = statuses.find((s: PartStatusDef) => {
				return s && typeof s.label === "string" && s.label === value;
			});
		}

		if (statusDef?.color && typeof statusDef.color === "string") {
			const trimmedColor = statusDef.color.trim();
			if (trimmedColor.length > 0) {
				colorClass = trimmedColor;
			}
		}

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
			></div>
		</div>
	);
};
