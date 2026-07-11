"use client";

import { useEffect } from "react";
import { initSentryClient } from "@/lib/sentry.client.config";

export function SentryProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		initSentryClient();
	}, []);

	return children;
}
