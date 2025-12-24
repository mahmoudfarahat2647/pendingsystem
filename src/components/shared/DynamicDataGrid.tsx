"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";
import type { DataGridProps } from "./DataGrid";

const DataGridComponent = dynamic(
	() => import("./DataGrid").then((mod) => mod.DataGrid),
	{
		loading: () => (
			<div className="w-full h-full p-4 space-y-4 bg-[#0c0c0e] border border-white/[0.08] rounded-xl">
				<div className="flex items-center gap-4 mb-6">
					<Skeleton className="h-8 w-24 bg-white/5" />
					<Skeleton className="h-8 w-24 bg-white/5" />
					<Skeleton className="h-8 w-full bg-white/5" />
				</div>
				<div className="space-y-2">
					{Array.from({ length: 10 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full bg-white/5" />
					))}
				</div>
			</div>
		),
		ssr: false, // Disable SSR for AG Grid as it's client-side only
	},
);

import { ClientErrorBoundary } from "./ClientErrorBoundary";

export const DynamicDataGrid = (props: DataGridProps) => {
	return (
		<ClientErrorBoundary fallbackTitle="Grid Loading Failed">
			<DataGridComponent {...props} />
		</ClientErrorBoundary>
	);
};
