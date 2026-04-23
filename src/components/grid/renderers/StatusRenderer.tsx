import type { ICellRendererParams } from "ag-grid-community";
import type { PendingRow } from "@/types";

// Status Badge Renderer - Minimalist text
export const StatusRenderer = (params: ICellRendererParams<PendingRow>) => {
	const value = params.value as string;
	const isReorder = value?.toUpperCase() === "REORDER";

	// Just simple text for the flat look, or minimal coloring if preferred
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
