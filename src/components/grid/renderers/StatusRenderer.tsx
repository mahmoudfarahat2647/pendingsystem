import type { ICellRendererParams } from "ag-grid-community";
import type { PendingRow } from "@/types";

export const WarrantyRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;

	const isExpired = data.remainTime === "Expired" || data.remainTime === "";

	return (
		<div
			className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-300"}`}
			title={`Start: ${data.startWarranty}\nEnd: ${data.endWarranty}`}
		>
			{data.remainTime || "N/A"}
		</div>
	);
};

export const StatusRenderer = (params: ICellRendererParams<PendingRow>) => {
	const value = params.value as string;
	return (
		<span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
			{value}
		</span>
	);
};
