import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import {
	COMBINED_LIMIT_BYTES,
	DB_LIMIT_BYTES,
	STORAGE_LIMIT_BYTES,
} from "@/lib/storage-limits";
import type { StorageStatsResponse } from "@/types";

/**
 * Recursively lists all files in a storage bucket, traversing subdirectories
 * and paginating beyond the 1,000-item limit per request.
 */
async function getRecursiveBucketSize(
	supabase: SupabaseClient,
	bucketId: string,
	prefix = "",
): Promise<number> {
	let totalSize = 0;
	let offset = 0;
	const PAGE_SIZE = 1000;

	while (true) {
		const { data: items, error } = await supabase.storage
			.from(bucketId)
			.list(prefix, { limit: PAGE_SIZE, offset });

		if (error) {
			throw error;
		}

		if (!items || items.length === 0) break;

		for (const item of items) {
			if (item.id === null) {
				// Directory — recurse into it
				const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
				totalSize += await getRecursiveBucketSize(
					supabase,
					bucketId,
					subPrefix,
				);
			} else {
				totalSize += item.metadata?.size || 0;
			}
		}

		if (items.length < PAGE_SIZE) break;
		offset += PAGE_SIZE;
	}

	return totalSize;
}

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

	const [dbResult, bucketsResult] = await Promise.allSettled([
		withTimeout(supabase.rpc("get_database_size_bytes"), "Database size RPC"),
		withTimeout(supabase.storage.listBuckets(), "Storage bucket listing"),
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

	if (bucketsResult.status === "fulfilled") {
		const { data: buckets, error: bucketError } = bucketsResult.value;
		if (!bucketError && buckets) {
			const bucketSizeResults = await Promise.allSettled(
				buckets.map((bucket) =>
					withTimeout(
						getRecursiveBucketSize(supabase, bucket.id),
						`Storage usage for bucket "${bucket.id}"`,
					),
				),
			);

			const hasBucketFailures = bucketSizeResults.some(
				(result) => result.status === "rejected",
			);

			if (hasBucketFailures) {
				for (const result of bucketSizeResults) {
					if (result.status === "rejected") {
						logger.error("Error computing storage usage:", result.reason);
					}
				}
			} else {
				storageUsedBytes = bucketSizeResults.reduce(
					(total, result) =>
						total + (result.status === "fulfilled" ? result.value : 0),
					0,
				);
				storageAvailable = true;
			}
		} else if (bucketError) {
			logger.error("Error listing storage buckets:", bucketError);
		}
	} else {
		logger.error("Error listing storage buckets:", bucketsResult.reason);
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
