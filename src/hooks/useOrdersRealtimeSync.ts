"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	DASHBOARD_STATS_QUERY_KEY,
	getOrdersQueryKey,
	NOTIFICATION_CANDIDATES_QUERY_KEY,
} from "@/lib/queryClient";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAppStore } from "@/store/useStore";

export function useOrdersRealtimeSync() {
	const queryClient = useQueryClient();
	const isDraftActive = useAppStore((s) => s.draftSession.isActive);
	const pendingUpdate = useRef(false);
	const pendingStages = useRef<Set<OrderStage>>(new Set());

	// Read draft-active state via a ref so the channel effect stays stable
	// across draft toggles instead of tearing down and recreating the socket.
	const isDraftActiveRef = useRef(isDraftActive);
	isDraftActiveRef.current = isDraftActive;

	// Flush any invalidations that were deferred while a draft was active.
	// Runs whenever isDraftActive changes from true → false.
	useEffect(() => {
		if (!isDraftActive && pendingUpdate.current) {
			pendingUpdate.current = false;
			const stages = Array.from(pendingStages.current);
			pendingStages.current.clear();

			if (stages.length > 0) {
				for (const stage of stages) {
					void queryClient.invalidateQueries({
						queryKey: getOrdersQueryKey(stage),
					});
				}
			} else {
				void queryClient.invalidateQueries({
					queryKey: ["orders"],
				});
			}

			void queryClient.invalidateQueries({
				queryKey: DASHBOARD_STATS_QUERY_KEY,
			});
			void queryClient.invalidateQueries({
				queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
			});
		}
	}, [isDraftActive, queryClient]);

	useEffect(() => {
		const supabase = getSupabaseBrowserClient();

		const invalidateStages = (stages: OrderStage[]) => {
			if (isDraftActiveRef.current) {
				pendingUpdate.current = true;
				for (const stage of stages) {
					pendingStages.current.add(stage);
				}
				toast.info(
					"Orders were updated in the background — changes will apply after saving your draft.",
					{
						id: "background-orders-update",
						duration: 6000,
					},
				);
			} else {
				if (stages.length > 0) {
					for (const stage of stages) {
						void queryClient.invalidateQueries({
							queryKey: getOrdersQueryKey(stage),
						});
					}
				} else {
					void queryClient.invalidateQueries({
						queryKey: ["orders"],
					});
				}
				void queryClient.invalidateQueries({
					queryKey: DASHBOARD_STATS_QUERY_KEY,
				});
				void queryClient.invalidateQueries({
					queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
				});
			}
		};

		const channel = supabase
			.channel("orders-realtime-sync")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "orders",
				},
				(payload: { new?: { stage?: OrderStage } }) => {
					const stage = payload?.new?.stage ?? "orders";
					if (stage === "orders") {
						if (isDraftActiveRef.current) {
							pendingUpdate.current = true;
							pendingStages.current.add("orders");
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
							void queryClient.invalidateQueries({
								queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
							});
						}
					} else if (stage) {
						invalidateStages([stage]);
					} else {
						invalidateStages([]);
					}
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "orders",
				},
				(payload: {
					new?: { stage?: OrderStage };
					old?: { stage?: OrderStage };
				}) => {
					const newStage = payload?.new?.stage;
					const oldStage = payload?.old?.stage;
					const stages: OrderStage[] = [];
					if (newStage) stages.push(newStage);
					if (oldStage && oldStage !== newStage) stages.push(oldStage);
					invalidateStages(stages);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "orders",
				},
				(payload: { old?: { stage?: OrderStage } }) => {
					const oldStage = payload?.old?.stage;
					invalidateStages(oldStage ? [oldStage] : []);
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [queryClient]);
}
