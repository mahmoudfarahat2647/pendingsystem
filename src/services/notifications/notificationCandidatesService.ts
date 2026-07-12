import { mapSupabaseOrder } from "@/services/orderMapper";
import type { PendingRow } from "@/types";

/**
 * Fetches the server-filtered candidate rows and maps them through the same
 * `mapSupabaseOrder` used by the stage-fetch path, so reminder derivation
 * (client-local date/time) and managedKey construction stay identical.
 *
 * Mirrors `fetchMappedOrders` (orderQueryRepository.ts): if any row fails
 * mapping, the whole fetch throws rather than silently dropping the row.
 * React Query then keeps the previous good candidate set instead of the
 * notification engine seeing a partial set and wrongly pruning dismissed
 * keys for rows that merely failed to map this cycle.
 */
export async function fetchDueNotificationCandidates(): Promise<PendingRow[]> {
	const response = await fetch("/api/notifications");
	if (!response.ok) {
		const errorData = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(errorData.error ?? `Server error: ${response.status}`);
	}

	const { candidates } = (await response.json()) as {
		candidates: Record<string, unknown>[];
	};

	return candidates.map((row) => mapSupabaseOrder(row));
}
