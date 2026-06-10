import { useCallback } from "react";
import { orderService } from "@/services/orderService";
import type { DuplicateCheckResult } from "@/types";

/**
 * Stable imperative delegate around
 * orderService.checkHistoricalVinPartDuplicate.
 *
 * Kept imperative (not a declarative useQuery) because call sites await it
 * mid-flow during submit/validation; converting to a query would change
 * timing and caching behavior.
 */
export function useHistoricalDuplicateCheck() {
	return useCallback(
		(
			vin: string,
			partNumber: string,
			excludeIds?: string | string[],
		): Promise<DuplicateCheckResult> =>
			orderService.checkHistoricalVinPartDuplicate(vin, partNumber, excludeIds),
		[],
	);
}
