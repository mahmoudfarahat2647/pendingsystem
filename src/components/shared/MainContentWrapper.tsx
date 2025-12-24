"use client";

import type React from "react";
import { SearchResultsView } from "@/components/shared/SearchResultsView";
import { useAutoMoveVins } from "@/hooks/useAutoMoveVins";
import { useAppStore } from "@/store/useStore";

interface MainContentWrapperProps {
	children: React.ReactNode;
}

export const MainContentWrapper = ({ children }: MainContentWrapperProps) => {
	useAutoMoveVins(); // Activate the watcher

	const { searchTerm } = useAppStore();
	const hasSearchTerm = searchTerm && searchTerm.trim().length > 0;

	if (hasSearchTerm) {
		return <SearchResultsView />;
	}

	return <>{children}</>;
};
