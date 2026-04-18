"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAppStore } from "@/store/useStore";

export function useOrdersRealtimeSync() {
	const queryClient = useQueryClient();
	const isDraftActive = useAppStore((s) => s.draftSession.isActive);

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
