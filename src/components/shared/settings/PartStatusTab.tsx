"use client";

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
	const rowData = useAppStore((state) => state.rowData);
	const ordersRowData = useAppStore((state) => state.ordersRowData);
	const callRowData = useAppStore((state) => state.callRowData);
	const archiveRowData = useAppStore((state) => state.archiveRowData);
	const bookingRowData = useAppStore((state) => state.bookingRowData);

	const getPartStatusUsage = (label: string) => {
		const allRows = [
			...rowData,
			...ordersRowData,
			...callRowData,
			...archiveRowData,
			...bookingRowData,
		];
		return allRows.filter((row) => row.partStatus === label).length;
	};

	return (
		<StatusManagementSection
			title="Add New Part Status"
			managedTitle="Managed Part Statuses"
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
		/>
	);
};
