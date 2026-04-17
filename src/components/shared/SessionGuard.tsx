"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { authClient } from "@/lib/auth-client";

const WARNING_TOAST_ID = "session-expiry-warning";

function formatMinutes(seconds: number): string {
	const m = Math.ceil(seconds / 60);
	return m === 1 ? "1 min" : `${m} min`;
}

export function SessionGuard() {
	const router = useRouter();
	const { status, secondsRemaining } = useSessionStatus();
	const { refetch: refetchSession } = authClient.useSession();
	const prevStatus = useRef<string | null>(null);
	const hasExpired = useRef(false);

	useEffect(() => {
		if (status === "expiringSoon" && secondsRemaining !== null) {
			toast.message(
				`Your session ends in ${formatMinutes(secondsRemaining)}. Stay signed in?`,
				{
					id: WARNING_TOAST_ID,
					duration: Number.POSITIVE_INFINITY,
					action: {
						label: "Stay signed in",
						onClick: async () => {
							await authClient.getSession({
								fetchOptions: { cache: "no-store" },
							});
							await refetchSession();
							toast.dismiss(WARNING_TOAST_ID);
						},
					},
					cancel: {
						label: "Sign out",
						onClick: async () => {
							await authClient.signOut();
							router.replace("/login");
						},
					},
				},
			);
		}

		if (
			status === "expired" &&
			!hasExpired.current &&
			prevStatus.current !== null
		) {
			hasExpired.current = true;
			toast.dismiss(WARNING_TOAST_ID);
			authClient.signOut().then(() => {
				router.replace("/login?expired=1");
			});
		}

		prevStatus.current = status;
	}, [status, secondsRemaining, router]);

	return null;
}
