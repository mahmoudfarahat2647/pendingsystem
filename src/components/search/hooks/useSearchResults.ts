import { useMemo } from "react";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

export function useSearchResults() {
	const searchTerm = useAppStore((state) => state.searchTerm);
	const setSearchTerm = useAppStore((state) => state.setSearchTerm);
	const rowData = useAppStore((state) => state.rowData); // Main Sheet
	const ordersRowData = useAppStore((state) => state.ordersRowData); // Orders
	const bookingRowData = useAppStore((state) => state.bookingRowData); // Booking
	const callRowData = useAppStore((state) => state.callRowData); // Call List
	const archiveRowData = useAppStore((state) => state.archiveRowData); // Archive

	// Aggregate Data
	const searchResults = useMemo(() => {
		if (!searchTerm || searchTerm.trim().length === 0) return [];

		const terms = searchTerm
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		if (terms.length === 0) return [];

		const allRows = [
			...rowData.map((r) => ({ ...r, sourceType: "Main Sheet" })),
			...ordersRowData.map((r) => ({ ...r, sourceType: "Orders" })),
			...bookingRowData.map((r) => ({ ...r, sourceType: "Booking" })),
			...callRowData.map((r) => ({ ...r, sourceType: "Call" })),
			...archiveRowData.map((r) => ({ ...r, sourceType: "Archive" })),
		];

		return allRows.filter((row) => {
			// Create a giant searchable string
			const searchString = [
				(row as any).sourceType,
				row.vin,
				row.customerName,
				row.partNumber,
				row.description,
				row.mobile,
				row.baseId,
				row.trackingId,
				row.model,
				row.company || "Renault",
				row.requester,
				row.sabNumber,
				row.acceptedBy,
				row.rDate,
				row.noteContent,
				row.repairSystem,
				row.actionNote,
				row.bookingDate,
				row.bookingNote,
				row.archiveReason,
			]
				.map((field) => (field ? String(field).toLowerCase() : ""))
				.join(" ");

			// Check if ALL terms match (AND logic)
			return terms.every((term) => searchString.includes(term));
		});
	}, [
		searchTerm,
		rowData,
		ordersRowData,
		bookingRowData,
		callRowData,
		archiveRowData,
	]);

	const handleClearSearch = () => {
		setSearchTerm("");
	};

	// Summary Counts
	const counts = useMemo(() => {
		return searchResults.reduce(
			(acc, curr) => {
				const source = (curr as any).sourceType || "Unknown";
				acc[source] = (acc[source] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
	}, [searchResults]);

	return {
		searchResults,
		searchTerm,
		setSearchTerm,
		clearSearch: handleClearSearch,
		counts,
	};
}
