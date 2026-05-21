import type { ICellRendererParams } from "ag-grid-community";
import { calculateRemainingTime } from "@/lib/utils";
import type { PendingRow } from "@/types";

// Warranty Info Renderer - shows remaining time with color coding
export const WarrantyRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;

	const remainTime = data.endWarranty
		? calculateRemainingTime(data.endWarranty)
		: "";
	const isExpired = remainTime === "Expired" || remainTime === "";

	return (
		<div
			className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-300"}`}
			title={`Start: ${data.startWarranty}\nEnd: ${data.endWarranty}`}
		>
			{remainTime || "N/A"}
		</div>
	);
};
