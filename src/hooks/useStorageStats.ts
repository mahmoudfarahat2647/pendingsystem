"use client";

import { useQuery } from "@tanstack/react-query";
import type { StorageStatsResponse } from "@/app/api/storage-stats/route";

/**
 * Fetches Supabase storage and database usage statistics via React Query.
 *
 * Data is refetched every 5 minutes and kept in cache for 10 minutes,
 * consistent with other query hooks in the codebase.
 *
 * @returns React Query result containing {@link StorageStatsResponse}.
 */
export function useStorageStats() {
	return useQuery<StorageStatsResponse>({
		queryKey: ["storage-stats"],
		queryFn: async (): Promise<StorageStatsResponse> => {
			const response = await fetch("/api/storage-stats");
			if (!response.ok) {
				throw new Error("Failed to fetch storage stats");
			}
			return response.json();
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
	});
}
