import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { addRateLimitHeaders, rateLimit } from "@/lib/rateLimit";
import {
	COMBINED_LIMIT_BYTES,
	DB_LIMIT_BYTES,
	STORAGE_LIMIT_BYTES,
} from "@/lib/storage-limits";

export const runtime = "nodejs";

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

		if (error || !items || items.length === 0) break;

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

/**
 * GET /api/storage-stats
 *
 * Fetches real-time database and file storage usage from Supabase.
 * Uses the service role key to perform administrative queries.
 * Rate limited to prevent abuse.
 *
 * @returns JSON containing per-source usage in bytes, limits, and availability flags.
 */
export async function GET(request: Request) {
	// Apply rate limiting
	const rateLimitResult = rateLimit(request);

	if (!rateLimitResult.success) {
		const response = NextResponse.json(
			{ error: "Too many requests. Please try again later." },
			{ status: 429 },
		);
		return addRateLimitHeaders(response, rateLimitResult);
	}

	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !serviceRoleKey) {
			console.error("Missing Supabase configuration for storage-stats API");
			const response = NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
			return addRateLimitHeaders(response, rateLimitResult);
		}

		// Create a service-role client to bypass RLS and access internal schemas
		const supabase = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		});

		// 1. Get Database Size via RPC
		let dbUsedBytes: number | null = null;
		let dbAvailable = false;

		const { data: dbData, error: dbError } = await supabase.rpc(
			"get_database_size_bytes",
		);

		if (dbError) {
			console.error("Error fetching DB size via RPC:", dbError);
		} else {
			dbUsedBytes = dbData;
			dbAvailable = true;
		}

		// 2. Get File Storage Size (recursive + paginated)
		let storageUsedBytes = 0;
		let storageAvailable = false;

		const { data: buckets, error: bucketError } =
			await supabase.storage.listBuckets();

		if (!bucketError && buckets) {
			storageAvailable = true;
			for (const bucket of buckets) {
				storageUsedBytes += await getRecursiveBucketSize(supabase, bucket.id);
			}
		} else if (bucketError) {
			console.error("Error listing storage buckets:", bucketError);
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
		return addRateLimitHeaders(response, rateLimitResult);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("Storage stats error:", error.message);
			const response = NextResponse.json(
				{ error: error.message },
				{ status: 500 },
			);
			return addRateLimitHeaders(response, rateLimitResult);
		}
		console.error("Storage stats error:", error);
		const response = NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
		return addRateLimitHeaders(response, rateLimitResult);
	}
}
