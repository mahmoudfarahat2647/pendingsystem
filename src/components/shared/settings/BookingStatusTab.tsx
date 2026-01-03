"use client";

import { useAppStore } from "@/store/useStore";
import type { PartStatusDef } from "@/types";
import { StatusManagementSection } from "./StatusManagementSection";

interface BookingStatusTabProps {
	isLocked: boolean;
}

export const BookingStatusTab = ({ isLocked }: BookingStatusTabProps) => {
	const bookingStatuses = useAppStore((state) => state.bookingStatuses);
	const addBookingStatusDef = useAppStore((state) => state.addBookingStatusDef);
	const updateBookingStatusDef = useAppStore(
		(state) => state.updateBookingStatusDef,
	);
	const removeBookingStatusDef = useAppStore(
		(state) => state.removeBookingStatusDef,
	);

	// Data for usage checks
	const rowData = useAppStore((state) => state.rowData);
	const ordersRowData = useAppStore((state) => state.ordersRowData);
	const callRowData = useAppStore((state) => state.callRowData);
	const archiveRowData = useAppStore((state) => state.archiveRowData);
	const bookingRowData = useAppStore((state) => state.bookingRowData);

	const getBookingStatusUsage = (label: string) => {
		const allRows = [
			...rowData,
			...ordersRowData,
			...callRowData,
			...archiveRowData,
			...bookingRowData,
		];
		return allRows.filter((row) => row.bookingStatus === label).length;
	};

	return (
		<StatusManagementSection
			title="Add New Booking Status"
			managedTitle="Managed Booking Statuses"
			statuses={bookingStatuses}
			onAdd={(label, color) => {
				const newStatus: PartStatusDef = {
					id: Math.random().toString(36).substring(2, 9),
					label,
					color,
				};
				addBookingStatusDef(newStatus);
			}}
			onUpdate={updateBookingStatusDef}
			onRemove={removeBookingStatusDef}
			checkUsage={getBookingStatusUsage}
			isLocked={isLocked}
		/>
	);
};
