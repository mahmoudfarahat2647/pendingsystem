"use client";

import type { ColDef, GridApi } from "ag-grid-community";
import dynamic from "next/dynamic";
import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataGridProps } from "./DataGrid";

// Re-export strict types for consumers
export type { ColDef, GridApi };

// Skeleton loader for grid
const GridSkeleton = () => (
	<div className="w-full h-full p-4 space-y-4 bg-[#0c0c0e] border border-white/[0.08] rounded-xl overflow-hidden">
		{/* Header skeleton */}
		<div className="flex gap-2 mb-6">
			{Array.from({ length: 6 }).map((_, i) => (
				<Skeleton key={`header-${i}`} className="h-8 flex-1 bg-white/5" />
			))}
		</div>
		{/* Row skeletons */}
		<div className="space-y-2">
			{Array.from({ length: 12 }).map((_, i) => (
				<div key={`row-${i}`} className="flex gap-2">
					{Array.from({ length: 6 }).map((_, j) => (
						<Skeleton
							key={`cell-${i}-${j}`}
							className="h-10 flex-1 bg-white/5"
						/>
					))}
				</div>
			))}
		</div>
	</div>
);

// Dynamic import with SSR disabled
const DataGridComponent = dynamic(
	() => import("./DataGrid").then((mod) => mod.DataGrid),
	{
		loading: () => <GridSkeleton />,
		ssr: false,
	},
);

// Preload the grid module during idle time
if (typeof window !== "undefined") {
	const preloadGrid = async () => {
		try {
			// These imports will be prefetched by the browser
			await import("./DataGrid");
			await import("ag-grid-community");
			await import("ag-grid-react");
		} catch (err) {
			// Swallow ChunkLoadError / HMR cache mismatches that may occur during dev
			// Log for debugging in development only
			if (process.env.NODE_ENV === "development") {
				// eslint-disable-next-line no-console
				console.debug("[preloadGrid] preload failed:", err);
			}
		}
	};

	if (typeof window !== "undefined") {
		if ("requestIdleCallback" in window) {
			requestIdleCallback(preloadGrid, { timeout: 2000 });
		} else {
			setTimeout(preloadGrid, 1000);
		}
	}
}

// Correctly type the memoized dynamic component to preserve generics
export const DynamicDataGrid = memo(DataGridComponent) as <
	T extends { id?: string; vin?: string },
>(
	props: DataGridProps<T>,
) => React.ReactNode;
