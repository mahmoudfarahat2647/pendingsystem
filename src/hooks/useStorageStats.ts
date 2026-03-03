"use client";

import { useEffect, useState } from "react";

interface StorageStats {
    dbUsedMB: number;
    storageUsedMB: number;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to fetch Supabase storage and database usage statistics.
 * 
 * @returns {StorageStats} The current usage stats, loading state, and any error.
 */
export function useStorageStats() {
    const [stats, setStats] = useState<StorageStats>({
        dbUsedMB: 0,
        storageUsedMB: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchStats() {
            try {
                const response = await fetch("/api/storage-stats");
                if (!response.ok) {
                    throw new Error("Failed to fetch storage stats");
                }
                const data = await response.json();

                if (isMounted) {
                    setStats({
                        dbUsedMB: data.dbUsedMB,
                        storageUsedMB: data.storageUsedMB,
                        loading: false,
                        error: null,
                    });
                }
            } catch (err: any) {
                if (isMounted) {
                    setStats(prev => ({
                        ...prev,
                        loading: false,
                        error: err.message || "An unexpected error occurred",
                    }));
                }
            }
        }

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, []);

    return stats;
}
