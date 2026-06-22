import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import {
	COMBINED_LIMIT_BYTES,
	DB_LIMIT_BYTES,
	STORAGE_LIMIT_BYTES,
} from "@/lib/storage-limits";
import type { StorageStatsResponse } from "@/types";

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(
				new Error(`${label} timed out after ${SUPABASE_REQUEST_TIMEOUT_MS}ms`),
			);
		}, SUPABASE_REQUEST_TIMEOUT_MS);

		Promise.resolve(promise).then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

/**
 * Fetches real-time database and file storage usage from Supabase.
 * Requires a service-role client that can perform admin queries.
 */
export async function getStorageStats(
	supabase: SupabaseClient,
): Promise<StorageStatsResponse> {
	let dbUsedBytes: number | null = null;
	let dbAvailable = false;
	let storageUsedBytes = 0;
	let storageAvailable = false;

	const [dbResult, storageResult] = await Promise.allSettled([
		withTimeout(supabase.rpc("get_database_size_bytes"), "Database size RPC"),
		withTimeout(supabase.rpc("get_storage_size_bytes"), "Storage size RPC"),
	]);

	if (dbResult.status === "fulfilled") {
		const { data: dbData, error: dbError } = dbResult.value;
		if (dbError) {
			logger.error("Error fetching DB size via RPC:", dbError);
		} else {
			dbUsedBytes = dbData;
			dbAvailable = true;
		}
	} else {
		logger.error("Error fetching DB size via RPC:", dbResult.reason);
	}

	if (storageResult.status === "fulfilled") {
		const { data: storageData, error: storageError } = storageResult.value;
		if (storageError) {
			logger.error("Error fetching storage size via RPC:", storageError);
		} else {
			storageUsedBytes = storageData ?? 0;
			storageAvailable = true;
		}
	} else {
		logger.error("Error fetching storage size via RPC:", storageResult.reason);
	}

	const combinedUsedBytes =
		dbAvailable && storageAvailable
			? (dbUsedBytes ?? 0) + storageUsedBytes
			: null;

	return {
		dbUsedBytes,
		dbLimitBytes: DB_LIMIT_BYTES,
		dbAvailable,
		storageUsedBytes,
		storageLimitBytes: STORAGE_LIMIT_BYTES,
		storageAvailable,
		combinedUsedBytes,
		combinedLimitBytes: COMBINED_LIMIT_BYTES,
		dataComplete: dbAvailable && storageAvailable,
	};
}
