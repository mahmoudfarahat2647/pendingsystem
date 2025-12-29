"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";

const PieChartResolved = dynamic(
	() => import("recharts").then((mod) => mod.PieChart as any),
	{
		ssr: false,
		loading: () => <Skeleton className="h-full w-full rounded-full" />,
	},
) as React.ComponentType<any>;

const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie as any), {
	ssr: false,
}) as React.ComponentType<any>;

const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell as any), {
	ssr: false,
}) as React.ComponentType<any>;

const ResponsiveContainer = dynamic(
	() => import("recharts").then((mod) => mod.ResponsiveContainer as any),
	{ ssr: false },
) as React.ComponentType<any>;

const BarChartResolved = dynamic(
	() => import("recharts").then((mod) => mod.BarChart as any),
	{
		ssr: false,
		loading: () => <Skeleton className="h-full w-full rounded-lg" />,
	},
) as React.ComponentType<any>;

const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar as any), {
	ssr: false,
}) as React.ComponentType<any>;

const XAxis = dynamic(
	() => import("recharts").then((mod) => mod.XAxis as any),
	{ ssr: false },
) as React.ComponentType<any>;

const YAxis = dynamic(
	() => import("recharts").then((mod) => mod.YAxis as any),
	{ ssr: false },
) as React.ComponentType<any>;

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
