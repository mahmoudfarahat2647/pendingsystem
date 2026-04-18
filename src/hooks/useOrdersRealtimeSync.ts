"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAppStore } from "@/store/useStore";

export function useOrdersRealtimeSync() {
	const queryClient = useQueryClient();
	const isDraftActive = useAppStore((s) => s.draftSession.isActive);
	const pendingUpdate = useRef(false);

	// Flush any INSERT that was deferred while a draft was active.
	// Runs whenever isDraftActive changes from true → false.
	useEffect(() => {
		if (!isDraftActive && pendingUpdate.current) {
			pendingUpdate.current = false;
			void queryClient.invalidateQueries({
				queryKey: getOrdersQueryKey("orders"),
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
					if (isDraftActive) {
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
					}
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [queryClient, isDraftActive]);
}
