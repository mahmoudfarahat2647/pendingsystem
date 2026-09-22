import type { ICellRendererParams } from "ag-grid-community";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveStatusLabel } from "@/lib/locale/statusLabel";
import type { PartStatusDef, PendingRow } from "@/types";

interface StatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const StatusRenderer = (params: StatusRendererProps) => {
	const { locale } = useTranslation();
	const rawValue = (params.value ?? "") as string;
	const value = rawValue || "Pending";
	const statuses = params.partStatuses || [];
	const statusDef = statuses.find(
		(status) =>
			status && typeof status.label === "string" && status.label === value,
	);

	if (statusDef) {
		const isCssColor =
			statusDef.color?.startsWith("#") || statusDef.color?.startsWith("rgb");
		const textStyle = isCssColor ? { color: statusDef.color } : undefined;
		const displayLabel = resolveStatusLabel(statusDef, locale);

		return (
			<span
				className={`text-[10px] uppercase tracking-wider font-semibold leading-none ${
					isCssColor ? "" : "text-gray-400"
				}`}
				style={textStyle}
				title={displayLabel}
			>
				{displayLabel}
			</span>
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
