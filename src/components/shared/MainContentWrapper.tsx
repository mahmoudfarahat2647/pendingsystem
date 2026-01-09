"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { useAutoMoveVins } from "@/hooks/useAutoMoveVins";
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
	useAutoMoveVins(); // Activate the watcher

	const searchTerm = useAppStore((state) => state.searchTerm);
	const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;

	if (hasSearchTerm) {
		return <SearchResultsView />;
	}

	return <>{children}</>;
};
