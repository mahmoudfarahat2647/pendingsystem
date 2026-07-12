"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
	DASHBOARD_STATS_QUERY_KEY,
	getOrdersQueryKey,
} from "@/lib/queryClient";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAppStore } from "@/store/useStore";

export function useOrdersRealtimeSync() {
	const queryClient = useQueryClient();
	const isDraftActive = useAppStore((s) => s.draftSession.isActive);
	const pendingUpdate = useRef(false);

	// Read draft-active state via a ref so the channel effect stays stable
	// across draft toggles instead of tearing down and recreating the socket.
	const isDraftActiveRef = useRef(isDraftActive);
	isDraftActiveRef.current = isDraftActive;

	// Flush any INSERT that was deferred while a draft was active.
	// Runs whenever isDraftActive changes from true → false.
	useEffect(() => {
		if (!isDraftActive && pendingUpdate.current) {
			pendingUpdate.current = false;
			void queryClient.invalidateQueries({
				queryKey: getOrdersQueryKey("orders"),
			});
			void queryClient.invalidateQueries({
				queryKey: DASHBOARD_STATS_QUERY_KEY,
			});
		}
	}, [isDraftActive, queryClient]);

	useEffect(() => {
		const supabase = getSupabaseBrowserClient();
		const channel = supabase
			.channel("orders-mobile-inserts")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "orders",
					filter: "stage=eq.orders",
				},
				() => {
					if (isDraftActiveRef.current) {
						pendingUpdate.current = true;
						toast.info(
							"New mobile orders available — refresh after saving your draft.",
							{
								id: "mobile-orders-notice",
								duration: 8000,
							},
						);
					} else {
						void queryClient.invalidateQueries({
							queryKey: getOrdersQueryKey("orders"),
						});
						void queryClient.invalidateQueries({
							queryKey: DASHBOARD_STATS_QUERY_KEY,
						});
					}
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [queryClient]);
}
