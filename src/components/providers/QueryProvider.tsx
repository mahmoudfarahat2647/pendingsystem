"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

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
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Optimize caching for better tab navigation
						staleTime: 1000 * 60 * 5, // 5 minutes - keep data fresh for longer
						gcTime: 1000 * 60 * 10, // 10 minutes - keep in memory longer
						retry: 1, // Reduce retries for faster failure detection
						refetchOnWindowFocus: false, // Don't refetch when switching tabs
						refetchOnReconnect: true, // But do refetch when reconnecting to network
						retryDelay: (attemptIndex) =>
							Math.min(1000 * 2 ** attemptIndex, 10000),
					},
					mutations: {
						onError: (error: Error) => {
							toast.error(`Operation failed: ${error.message}`);
						},
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{Devtools ? <Devtools initialIsOpen={false} /> : null}
		</QueryClientProvider>
	);
}
