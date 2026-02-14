"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { useAppStore } from "@/store/useStore";

// Lazy load the search results view to avoid bundling AgGrid on initial load
const SearchResultsView = dynamic(
	() =>
		import("@/components/shared/SearchResultsView").then(
			(mod) => mod.SearchResultsView,
		),
	{
		loading: () => null,
		ssr: false,
	},
);

interface MainContentWrapperProps {
	children: React.ReactNode;
}

export const MainContentWrapper = ({ children }: MainContentWrapperProps) => {
	// const useAutoMoveVins removed - functionality moved to React Query mutations
	// useAutoMoveVins(); // Activate the watcher

	const searchTerm = useAppStore((state) => state.searchTerm);
	const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;

	// Usage checks for part status removed as server data is no longer in Zustand
	// TODO: Re-implement usage checks using React Query cache if needed
	const _rowData: any[] = [];
	const _ordersRowData: any[] = [];
	const _callRowData: any[] = [];
	const _bookingRowData: any[] = [];
	const _archiveRowData: any[] = [];

	if (hasSearchTerm) {
		return <SearchResultsView />;
	}

	return <>{children}</>;
};
