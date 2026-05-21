"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { queryClient } from "@/lib/queryClient";
import {
	createReactQueryAdapter,
	setOrdersQueryAdapter,
} from "@/store/ordersQueryAdapter";

// Register the React Query–backed adapter synchronously at module load so the
// first store action (which may run before any component mounts) already sees
// it. See architecture-audit.md H1.
setOrdersQueryAdapter(createReactQueryAdapter(queryClient));

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
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{Devtools ? <Devtools initialIsOpen={false} /> : null}
		</QueryClientProvider>
	);
}
