"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";

/* biome-ignore lint/suspicious/noExplicitAny: Recharts types are complex to handle with next/dynamic */
const PieChartResolved = dynamic(
	() => import("recharts").then((mod) => mod.PieChart as any),
	{
		ssr: false,
		loading: () => <Skeleton className="h-full w-full rounded-full" />,
	},
) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie as any), {
	ssr: false,
}) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell as any), {
	ssr: false,
}) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const ResponsiveContainer = dynamic(
	() => import("recharts").then((mod) => mod.ResponsiveContainer as any),
	{ ssr: false },
) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const BarChartResolved = dynamic(
	() => import("recharts").then((mod) => mod.BarChart as any),
	{
		ssr: false,
		loading: () => <Skeleton className="h-full w-full rounded-lg" />,
	},
) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar as any), {
	ssr: false,
}) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const XAxis = dynamic(
	() => import("recharts").then((mod) => mod.XAxis as any),
	{ ssr: false },
) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const YAxis = dynamic(
	() => import("recharts").then((mod) => mod.YAxis as any),
	{ ssr: false },
) as React.ComponentType<any>;

/* biome-ignore lint/suspicious/noExplicitAny: legacy chart types */
const Tooltip = dynamic(
	() => import("recharts").then((mod) => mod.Tooltip as any),
	{ ssr: false },
) as React.ComponentType<any>;

export {
	PieChartResolved as PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChartResolved as BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
};
