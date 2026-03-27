import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	COMBINED_LIMIT_BYTES,
	DB_LIMIT_BYTES,
	STORAGE_LIMIT_BYTES,
} from "@/lib/storage-limits";

export const runtime = "nodejs";
const SUPABASE_REQUEST_TIMEOUT_MS = 30000;

/** Response shape returned by GET /api/storage-stats. */
export interface StorageStatsResponse {
	dbUsedBytes: number | null;
	dbLimitBytes: number;
	dbAvailable: boolean;
	storageUsedBytes: number;
	storageLimitBytes: number;
	storageAvailable: boolean;
	combinedUsedBytes: number | null;
	combinedLimitBytes: number;
	dataComplete: boolean;
}

/**
 * Recursively lists all files in a storage bucket, traversing subdirectories
 * and paginating beyond the 1,000-item limit per request.
 *
 * @param supabase - Authenticated Supabase client
 * @param bucketId - ID of the storage bucket to list
 * @param prefix - Current directory prefix (empty string for root)
 * @returns Total size in bytes of all files found
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

function createTimeoutFetch(timeoutMs: number): typeof fetch {
	return (input, init) => {
		const timeoutSignal = AbortSignal.timeout(timeoutMs);
		const signal =
			init?.signal == null
				? timeoutSignal
				: AbortSignal.any([init.signal, timeoutSignal]);

		return fetch(input, {
			...init,
			signal,
		});
	};
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
 * GET /api/storage-stats
 *
 * Fetches real-time database and file storage usage from Supabase.
 * Uses the service role key to perform administrative queries.
 *
 * @returns JSON containing per-source usage in bytes, limits, and availability flags.
 */
export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !serviceRoleKey) {
			console.error("Missing Supabase configuration for storage-stats API");
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
		}

		// Create a service-role client to bypass RLS and access internal schemas
		const supabase = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
			global: {
				fetch: createTimeoutFetch(SUPABASE_REQUEST_TIMEOUT_MS),
			},
		});

		// 1. Get Database Size via RPC
		let dbUsedBytes: number | null = null;
		let dbAvailable = false;

		// 2. Get File Storage Size (recursive + paginated)
		let storageUsedBytes = 0;
		let storageAvailable = false;

		const [dbResult, bucketsResult] = await Promise.allSettled([
			withTimeout(supabase.rpc("get_database_size_bytes"), "Database size RPC"),
			withTimeout(supabase.storage.listBuckets(), "Storage bucket listing"),
		]);

		if (dbResult.status === "fulfilled") {
			const { data: dbData, error: dbError } = dbResult.value;
			if (dbError) {
				console.error("Error fetching DB size via RPC:", dbError);
			} else {
				dbUsedBytes = dbData;
				dbAvailable = true;
			}
		} else {
			console.error("Error fetching DB size via RPC:", dbResult.reason);
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
							console.error("Error computing storage usage:", result.reason);
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
				console.error("Error listing storage buckets:", bucketError);
			}
		} else {
			console.error("Error listing storage buckets:", bucketsResult.reason);
		}

		const combinedUsedBytes =
			dbAvailable && storageAvailable
				? (dbUsedBytes ?? 0) + storageUsedBytes
				: null;

		const responseData: StorageStatsResponse = {
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

		const response = NextResponse.json(responseData);
		return response;
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("Storage stats error:", error.message);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		console.error("Storage stats error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
