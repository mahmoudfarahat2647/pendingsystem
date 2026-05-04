import type { ICellRendererParams } from "ag-grid-community";
import type { PartStatusDef, PendingRow } from "@/types";

interface StatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const StatusRenderer = (params: StatusRendererProps) => {
	const value = (params.value ?? "") as string;
	const statuses = params.partStatuses || [];
	const statusDef = statuses.find(
		(status) =>
			status && typeof status.label === "string" && status.label === value,
	);

	if (statusDef) {
		const isCssColor =
			statusDef.color?.startsWith("#") || statusDef.color?.startsWith("rgb");
		const dotStyle = isCssColor
			? { backgroundColor: statusDef.color }
			: undefined;
		const colorClass = isCssColor ? "" : (statusDef.color ?? "");

		return (
			<div
				className="flex items-center justify-center h-full w-full gap-1.5 px-1"
				title={value}
			>
				<div
					className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-sm ring-1 ring-black/10 flex-shrink-0`}
					style={dotStyle}
				/>
			</div>
		);
	}

	const isReorder = value?.toUpperCase() === "REORDER";

	return (
		<span
			className={`text-[10px] uppercase tracking-wider font-semibold ${
				isReorder ? "text-[#d4a017]" : "text-gray-400"
			}`}
		>
			{value}
		</span>
	);
};
