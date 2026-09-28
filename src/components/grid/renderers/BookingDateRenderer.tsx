import type { ICellRendererParams } from "ag-grid-community";
import { isExpiredWarrantyRow } from "@/domain/order/warranty";
import type { PendingRow } from "@/types";

/**
 * Booking tab BOOKING DATE cell. Renders the column's formatted date and, for
 * a line rebooked from Archive whose warranty has expired, a small muted
 * "Warranty expired" tag.
 */
export const BookingDateRenderer = (
	params: ICellRendererParams<PendingRow>,
) => {
	const row = params.data;
	const showExpiredTag = Boolean(
		row?.rebookedFromArchive && isExpiredWarrantyRow(row),
	);

	return (
		<span className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
			<span className="truncate">{params.valueFormatted ?? params.value}</span>
			{showExpiredTag && (
				<span
					data-testid="warranty-expired-tag"
					className="shrink-0 text-[11px] font-normal text-slate-500 dark:text-slate-400"
				>
					Warranty expired
				</span>
			)}
		</span>
	);
};
