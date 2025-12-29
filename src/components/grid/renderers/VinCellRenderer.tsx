import type { ICellRendererParams } from "ag-grid-community";
import { getVinColor } from "@/lib/utils";
import type { PendingRow } from "@/types";

export const VinCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const vin = params.value as string;
	if (!vin) return null;

	const style = getVinColor(vin);

	return (
		<div className="flex items-center justify-start h-full">
			<span
				className="px-2 py-0 rounded-full text-[11px] font-bold tracking-normal shadow-sm border border-transparent"
				style={{
					backgroundColor: style.bg,
					color: style.text,
					borderColor: style.border,
				}}
			>
				{vin}
			</span>
		</div>
	);
};
