"use client";

import {
	useSaveOrderMutation,
	useUpdateOrderStageMutation,
} from "@/hooks/queries/useOrdersQuery";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";
import { useSearchResults } from "./hooks/useSearchResults";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchResultsGrid } from "./SearchResultsGrid";
import { SearchResultsHeader } from "./SearchResultsHeader";

export const SearchResultsView = () => {
	const { searchResults, searchTerm, clearSearch, counts } = useSearchResults();
	const partStatuses = useAppStore((state) => state.partStatuses);
	const rowData = useAppStore((state) => state.rowData);
	const ordersRowData = useAppStore((state) => state.ordersRowData);

	// Mutations
	const saveOrderMutation = useSaveOrderMutation();
	const updateStageMutation = useUpdateOrderStageMutation();

	// Helper for persistent updates
	const handleUpdateOrder = (
		id: string,
		updates: Partial<PendingRow>,
		stage?: string,
	) => {
		const mappedStage = (stage?.toLowerCase().replace(" ", "-") ||
			"main") as any;
		saveOrderMutation.mutate({ id, updates, stage: mappedStage });
	};

	if (!searchTerm) return null;

	return (
		<div className="flex flex-col h-full bg-[#0a0a0b] text-white">
			<SearchResultsHeader
				searchTerm={searchTerm}
				resultCount={searchResults.length}
				counts={counts}
				onClear={clearSearch}
			/>

			<div className="flex-1 p-6 overflow-hidden">
				{searchResults.length > 0 ? (
					<SearchResultsGrid
						searchResults={searchResults}
						partStatuses={partStatuses}
						rowData={rowData}
						ordersRowData={ordersRowData}
						onUpdateOrder={handleUpdateOrder}
						onUpdateStage={updateStageMutation.mutateAsync}
					/>
				) : (
					<SearchEmptyState searchTerm={searchTerm} onClear={clearSearch} />
				)}
			</div>
		</div>
	);
};
