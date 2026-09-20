import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { RELEASE_FOLLOW_UPS_QUERY_KEY } from "@/lib/queryClient";
import type { ReleaseFollowUp } from "@/schemas/releaseFollowUp.schema";
import { releaseFollowUpService } from "@/services/releaseFollowUpService";
import { useAppStore } from "@/store/useStore";

const RELEASE_FOLLOW_UPS_REFETCH_MS = 60_000;

/** Keeps the release follow-up cache fresh and nudges checkNotifications when it changes. */
export function useReleaseFollowUpsQuery(): UseQueryResult<
	ReleaseFollowUp[],
	Error
> {
	const checkNotifications = useAppStore((s) => s.checkNotifications);

	const query = useQuery<ReleaseFollowUp[]>({
		queryKey: RELEASE_FOLLOW_UPS_QUERY_KEY,
		queryFn: () => releaseFollowUpService.list(),
		refetchInterval: RELEASE_FOLLOW_UPS_REFETCH_MS,
		refetchOnWindowFocus: true,
	});

	useEffect(() => {
		if (query.data !== undefined) {
			checkNotifications();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query.data, checkNotifications]);

	return query;
}

interface UpsertVariables {
	vin: string;
	nextDueAt: Date;
	referenceRowId?: string | null;
}

/** Schedules (or reschedules/snoozes) a chassis-level release follow-up. */
export function useUpsertReleaseFollowUpMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ vin, nextDueAt, referenceRowId }: UpsertVariables) =>
			releaseFollowUpService.upsert(vin, nextDueAt, referenceRowId),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: RELEASE_FOLLOW_UPS_QUERY_KEY,
			});
		},
	});
}

/** Clears any pending/due release follow-up for the given VINs. */
export function useClearReleaseFollowUpsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (vins: string[]) => releaseFollowUpService.clear(vins),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: RELEASE_FOLLOW_UPS_QUERY_KEY,
			});
		},
	});
}
