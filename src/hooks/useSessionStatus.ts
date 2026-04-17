"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export type SessionStatus = "active" | "expiringSoon" | "expired";

interface SessionStatusResult {
	status: SessionStatus;
	expiresAt: Date | null;
	secondsRemaining: number | null;
}

const EXPIRING_SOON_THRESHOLD = 5 * 60; // 5 minutes in seconds

function computeStatus(expiresAt: Date): SessionStatusResult {
	const secondsRemaining = Math.floor(
		(expiresAt.getTime() - Date.now()) / 1000,
	);
	if (secondsRemaining <= 0) {
		return { status: "expired", expiresAt, secondsRemaining: 0 };
	}
	if (secondsRemaining <= EXPIRING_SOON_THRESHOLD) {
		return { status: "expiringSoon", expiresAt, secondsRemaining };
	}
	return { status: "active", expiresAt, secondsRemaining };
}

/** Sentinel used when the session is confirmed absent (backend returned null). */
const EXPIRED_RESULT: SessionStatusResult = {
	status: "expired",
	expiresAt: null,
	secondsRemaining: 0,
};

export function useSessionStatus(): SessionStatusResult {
	const { data: session, isPending } = authClient.useSession();

	// null → session confirmed absent; undefined → still loading
	const sessionConfirmedMissing = !isPending && session === null;

	const expiresAt = session?.session?.expiresAt
		? new Date(session.session.expiresAt)
		: null;

	const [result, setResult] = useState<SessionStatusResult>(() =>
		sessionConfirmedMissing || !expiresAt
			? EXPIRED_RESULT
			: computeStatus(expiresAt),
	);

	useEffect(() => {
		if (sessionConfirmedMissing || !expiresAt) {
			setResult(EXPIRED_RESULT);
			return;
		}

		setResult(computeStatus(expiresAt));

		const interval = setInterval(() => {
			setResult(computeStatus(expiresAt));
		}, 30_000);

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				setResult(computeStatus(expiresAt));
			}
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [expiresAt, sessionConfirmedMissing]);

	return result;
}
