import type { ICellRendererParams } from "ag-grid-community";
import { Phone } from "lucide-react";
import type { PendingRow } from "@/types";

export const MobileCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const mobile = params.value as string | undefined;
	if (!mobile) return null;

	return (
		<div
			className="flex items-center gap-1.5 h-full"
			style={{ color: "#22c55e" }}
		>
			<Phone className="h-3.5 w-3.5 shrink-0" />
			<span>{mobile}</span>
		</div>
	);
};
