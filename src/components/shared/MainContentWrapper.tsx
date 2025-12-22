"use client";

import React from "react";
import { useAppStore } from "@/store/useStore";
import { SearchResultsView } from "@/components/shared/SearchResultsView";
import { useAutoMoveVins } from "@/hooks/useAutoMoveVins";

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
