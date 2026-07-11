"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAppQueryClient } from "@/lib/queryClient";
import {
	clearOrdersQueryAdapter,
	createReactQueryAdapter,
	setOrdersQueryAdapter,
} from "@/store/ordersQueryAdapter";

const Devtools =
	process.env.NODE_ENV === "development"
		? dynamic(
				() =>
					import("@tanstack/react-query-devtools").then(
						(mod) => mod.ReactQueryDevtools,
					),
				{ ssr: false },
			)
		: null;

export default function QueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// One isolated QueryClient per provider mount (per request/session). The
	// `useState` initializer stays pure — creating the client only — so React's
	// StrictMode double-invoke never registers a client that gets discarded.
	const [queryClient] = useState(() => createAppQueryClient());

	// Register the React Query–backed adapter so the Zustand notification store
	// reads through the *live* client bound to this provider. This runs on mount,
	// well before Header's first notification check (deferred ~3s), so
	// `checkNotifications` never sees a stale/undefined adapter. The cleanup keeps
	// registration symmetric across mount/unmount and StrictMode's dev-only
	// setup->cleanup->setup replay, so the counter never falsely reports a double
	// registration. See architecture-audit.md H1.
	useEffect(() => {
		setOrdersQueryAdapter(createReactQueryAdapter(queryClient));
		return () => {
			clearOrdersQueryAdapter();
		};
	}, [queryClient]);

	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>{children}</TooltipProvider>
			{Devtools ? <Devtools initialIsOpen={false} /> : null}
		</QueryClientProvider>
	);
}
