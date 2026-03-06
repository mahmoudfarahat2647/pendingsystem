import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
				totalSize += await getRecursiveBucketSize(supabase, bucketId, subPrefix);
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
 *
 * @returns {Promise<NextResponse>} JSON containing dbUsedMB and storageUsedMB
 */
export async function GET() {
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
		});

		// 1. Get Database Size via RPC
		const { data: dbData, error: dbError } = await supabase.rpc(
			"get_database_size_bytes",
		);

		let dbSizeBytes: number | null = null;
		if (dbError) {
			console.error("Error fetching DB size via RPC:", dbError);
		} else {
			dbSizeBytes = dbData;
		}

		// 2. Get File Storage Size (recursive + paginated)
		const { data: buckets, error: bucketError } =
			await supabase.storage.listBuckets();

		let storageSizeBytes = 0;
		if (!bucketError && buckets) {
			for (const bucket of buckets) {
				storageSizeBytes += await getRecursiveBucketSize(supabase, bucket.id);
			}
		}

		const dbUsedMB =
			dbSizeBytes !== null
				? Number((dbSizeBytes / (1024 * 1024)).toFixed(2))
				: null;
		const storageUsedMB = Number((storageSizeBytes / (1024 * 1024)).toFixed(2));

		return NextResponse.json({
			dbUsedMB,
			storageUsedMB,
		});
	} catch (error: any) {
		console.error("Storage stats error:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 },
		);
	}
}

