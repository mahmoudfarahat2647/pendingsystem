/**
 * Process items in batches to avoid overwhelming system resources (e.g., database connection pool).
 *
 * @param items The items to process
 * @param batchSize Number of items per batch
 * @param processor Function to process a single batch
 * @returns Combined results from all batches
 */
export async function processBatch<T, R>(
	items: T[],
	batchSize: number,
	processor: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
	const results: R[] = [];

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await processor(batch);
		results.push(...batchResults);
	}

	return results;
}
