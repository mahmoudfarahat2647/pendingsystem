import type { ICellRendererParams } from "ag-grid-community";
import type { PendingRow } from "@/types";

// Status Badge Renderer - Minimalist text
export const StatusRenderer = (params: ICellRendererParams<PendingRow>) => {
	const value = params.value as string;
	// Just simple text for the flat look, or minimal coloring if preferred
	return (
		<span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
			{value}
		</span>
	);
};
