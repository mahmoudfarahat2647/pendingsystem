"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

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
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
