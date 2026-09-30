import type { ICellRendererParams } from "ag-grid-community";
import type React from "react";
import type { PartStatusDef, PendingRow } from "@/types";

interface StatusRendererProps extends ICellRendererParams<PendingRow> {
	partStatuses?: PartStatusDef[];
}

export const StatusRenderer = (params: StatusRendererProps) => {
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
		// `.status-chip` (globals.css) renders the plain colour in Dark and a
		// tinted chip in White; the stored colour itself is never modified.
		const textStyle = isCssColor
			? ({ "--status-color": statusDef.color } as React.CSSProperties)
			: undefined;

		return (
			<span
				className={`text-[10px] uppercase tracking-wider font-semibold leading-none ${
					isCssColor ? "status-chip" : "text-gray-600 dark:text-gray-400"
				}`}
				style={textStyle}
				title={value}
			>
				{value}
			</span>
		);
	}

	const isReorder = value?.toUpperCase() === "REORDER";

	return (
		<span
			className={`text-[10px] uppercase tracking-wider font-semibold ${
				isReorder
					? "text-[#a16207] dark:text-[#d4a017]"
					: "text-gray-600 dark:text-gray-400"
			}`}
		>
			{value}
		</span>
	);
};
