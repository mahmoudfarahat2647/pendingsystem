import type { ICellRendererParams } from "ag-grid-community";
import { getVinColor } from "@/lib/utils";
import type { PendingRow } from "@/types";

// VIN Cell Renderer - applies unique branded 'tonal' style based on VIN
export const VinCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const vin = params.value as string;
	if (!vin) return null;

	const style = getVinColor(vin);

	return (
		<div className="flex items-center justify-center h-full py-1">
			<span
				className="inline-flex items-center justify-center px-4 py-2 leading-none rounded-full text-[12px] font-bold shadow-sm border border-transparent"
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
