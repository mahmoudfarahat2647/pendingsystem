"use client";

import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";
import { useAppStore } from "@/store/useStore";
import type { PartStatusDef } from "@/types";
import { StatusManagementSection } from "./StatusManagementSection";

interface PartStatusTabProps {
	isLocked: boolean;
}

export const PartStatusTab = ({ isLocked }: PartStatusTabProps) => {
	const partStatuses = useAppStore((state) => state.partStatuses);
	const addPartStatusDef = useAppStore((state) => state.addPartStatusDef);
	const updatePartStatusDef = useAppStore((state) => state.updatePartStatusDef);
	const removePartStatusDef = useAppStore((state) => state.removePartStatusDef);

	// Data for usage checks
	const { data: rowData = [] } = useOrdersQuery("main");
	const { data: ordersRowData = [] } = useOrdersQuery("orders");
	const { data: callRowData = [] } = useOrdersQuery("call");
	const { data: archiveRowData = [] } = useOrdersQuery("archive");
	const { data: bookingRowData = [] } = useOrdersQuery("booking");

	const getPartStatusUsage = (label: string) => {
		const allRows = [
			...rowData,
			...ordersRowData,
			...callRowData,
			...archiveRowData,
			...bookingRowData,
		];
		return allRows.filter((row) => row.status === label).length;
	};

	return (
		<StatusManagementSection
			title="Add New Status"
			managedTitle="Managed Statuses"
			statuses={partStatuses}
			onAdd={(label, color) => {
				const newStatus: PartStatusDef = {
					id: Math.random().toString(36).substring(2, 9),
					label,
					color,
				};
				addPartStatusDef(newStatus);
			}}
			onUpdate={updatePartStatusDef}
			onRemove={removePartStatusDef}
			checkUsage={getPartStatusUsage}
			isLocked={isLocked}
			lockColors
		/>
	);
};
