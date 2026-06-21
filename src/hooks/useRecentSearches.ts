import { useCallback, useState } from "react";
import { logger } from "@/lib/logger";

const STORAGE_KEY = "pending-sys-recent-searches";
const MAX_RECENT = 8;

function readFromStorage(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as string[]) : [];
	} catch (err) {
		logger.warn("useRecentSearches: failed to read from localStorage", err);
		return [];
	}
}

function writeToStorage(searches: string[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
	} catch (err) {
		logger.warn("useRecentSearches: failed to persist to localStorage", err);
	}
}

export function useRecentSearches() {
	const [recentSearches, setRecentSearches] = useState<string[]>(() =>
		readFromStorage(),
	);

	const addSearch = useCallback((term: string) => {
		const trimmed = term.trim();
		if (trimmed.length < 2) return;
		setRecentSearches((prev) => {
			const filtered = prev.filter((s) => s !== trimmed);
			const next = [trimmed, ...filtered].slice(0, MAX_RECENT);
			writeToStorage(next);
			return next;
		});
	}, []);

	const removeSearch = useCallback((term: string) => {
		setRecentSearches((prev) => {
			const next = prev.filter((s) => s !== term);
			writeToStorage(next);
			return next;
		});
	}, []);

	const clearAll = useCallback(() => {
		setRecentSearches([]);
		writeToStorage([]);
	}, []);

	return { recentSearches, addSearch, removeSearch, clearAll };
}
