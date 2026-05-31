"use client";

import { BarChart3, Car, Package, TrendingUp } from "lucide-react";
import { useId } from "react";
import { Pie, PieChart } from "recharts";
import {
	Bar,
	BarChart,
	BarLineIndicator,
	BarXAxis,
	ChartTooltip,
	Grid,
	LinearGradient,
} from "@/components/ui/bar-chart";
import { Card, CardContent } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltipContent,
	ChartTooltip as ShadcnChartTooltip,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	LostSalesReport,
	PartDemand,
} from "@/domain/reports/lostSalesAnalysis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LostSalesReportViewProps {
	report: LostSalesReport | undefined;
	isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Internal: small bar chart reused for both sections
// ---------------------------------------------------------------------------

type ChartData = {
	name: string;
	value: number;
	description?: string;
	models?: string[];
};

interface SectionChartProps {
	data: ChartData[];
}

function SectionChart({ data }: SectionChartProps) {
	const uid = useId();
	const gradientId = `barGradient-${uid}`;

	return (
		<div className="w-full">
			<BarChart
				data={data}
				xDataKey="name"
				barGap={0}
				animationDuration={1000}
				margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
			>
				<LinearGradient from="#FFCC00" to="transparent" id={gradientId} />
				<Grid horizontal />
				<Bar
					dataKey="value"
					fill={`url(#${gradientId})`}
					lineCap="butt"
					stroke="#FFCC00"
				/>
				<BarXAxis tickerHalfWidth={40} />
				<ChartTooltip
					showCrosshair={false}
					showDots={false}
					content={({ point }) => {
						const d = point as unknown as ChartData;
						const modelLabel = d.models?.filter(Boolean).join(" / ") || null;
						return (
							<div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs text-gray-200 shadow-2xl">
								<p className="font-semibold text-white">
									{d.description || d.name}
								</p>
								{modelLabel && (
									<p className="text-[10px] text-gray-400 mt-1">{modelLabel}</p>
								)}
								<p className="mt-2 text-gray-300">
									Count:{" "}
									<span className="font-bold text-renault-yellow">
										{d.value}
									</span>
								</p>
							</div>
						);
					}}
				/>
				<BarLineIndicator
					data={data}
					valueKey="value"
					xKey="name"
					stroke="#FFCC00"
					strokeWidth={2}
				/>
			</BarChart>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Internal: pie chart for model demand
// ---------------------------------------------------------------------------

const CHART_COLORS = [
	"--chart-1",
	"--chart-2",
	"--chart-3",
	"--chart-4",
	"--chart-5",
] as const;

function sanitizeKey(name: string): string {
	return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

function ModelsPieChart({ data }: SectionChartProps) {
	const chartConfig = Object.fromEntries(
		data.map((d, i) => [
			sanitizeKey(d.name),
			{
				label: d.name,
				color: `hsl(var(${CHART_COLORS[i % CHART_COLORS.length]}))`,
			},
		]),
	) satisfies ChartConfig;

	const filledData = data.map((d) => ({
		...d,
		fill: `var(--color-${sanitizeKey(d.name)})`,
	}));

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square max-h-[260px] [&_.recharts-pie-label-text]:fill-gray-300"
		>
			<PieChart>
				<ShadcnChartTooltip content={<ChartTooltipContent hideLabel />} />
				<Pie
					data={filledData}
					dataKey="value"
					nameKey="name"
					label
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={95}
					paddingAngle={2}
					cornerRadius={4}
					strokeWidth={0}
				/>
			</PieChart>
		</ChartContainer>
	);
}

// ---------------------------------------------------------------------------
// Internal: KPI card
// ---------------------------------------------------------------------------

interface KpiCardProps {
	label: string;
	value: number;
	icon: React.ReactNode;
}

function KpiCard({ label, value, icon }: KpiCardProps) {
	return (
		<Card className="bg-[#0c0c0e]/90 border-white/10 hover:bg-white/5 hover:border-renault-yellow/20 transition-all duration-300 group cursor-default">
			<CardContent className="p-3">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-renault-yellow/10 text-renault-yellow group-hover:bg-renault-yellow/20 group-hover:scale-110 transition-all duration-300">
						{icon}
					</div>
					<div>
						<p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase group-hover:text-gray-300 transition-colors">
							{label}
						</p>
						<p className="text-2xl font-black text-white group-hover:text-renault-yellow transition-colors">
							{value.toLocaleString()}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Internal: section wrapper card
// ---------------------------------------------------------------------------

interface SectionCardProps {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
	return (
		<Card className="bg-[#0c0c0e]/90 border-white/10">
			<CardContent className="p-4">
				<div className="flex items-center gap-2 mb-3">
					<div className="text-renault-yellow">{icon}</div>
					<h3 className="text-sm font-bold text-white tracking-wide uppercase">
						{title}
					</h3>
				</div>
				{children}
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Internal: data tables
// ---------------------------------------------------------------------------

function PartsTable({ rows }: { rows: PartDemand[] }) {
	return (
		<div className="overflow-x-auto overflow-y-auto max-h-[180px] mt-4 rounded-md border border-white/5 custom-scrollbar">
			<table className="w-full border-collapse text-xs text-gray-300">
				<thead className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm z-10 shadow-sm shadow-black/50">
					<tr className="border-b border-white/10">
						<th className="text-left py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							#
						</th>
						<th className="text-left py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							Part Number
						</th>
						<th className="text-left py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							Description
						</th>
						<th className="text-right py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							Order Count
						</th>
						<th className="text-right py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							Total Qty
						</th>
						<th className="text-left py-3 px-4 text-renault-yellow font-bold uppercase tracking-wider">
							Model
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((part, idx) => (
						<tr
							key={part.partNumber}
							className="border-b border-white/5 even:bg-white/[0.02] hover:bg-white/[0.08] transition-colors cursor-default"
						>
							<td className="py-2.5 px-4 text-gray-500 font-medium">
								{idx + 1}
							</td>
							<td className="py-2.5 px-4 font-mono text-white/80">
								{part.partNumber}
							</td>
							<td className="py-2.5 px-4 text-gray-300 max-w-[260px] truncate">
								{part.description || "—"}
							</td>
							<td className="py-2.5 px-4 text-right text-white font-semibold">
								{part.orderCount.toLocaleString()}
							</td>
							<td className="py-2.5 px-4 text-right text-gray-400">
								{part.totalQuantity.toLocaleString()}
							</td>
							<td className="py-2.5 px-4 text-gray-400 max-w-[120px] truncate">
								{part.models.filter(Boolean).join(" / ") || "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Internal: loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
	return (
		<div className="space-y-6">
			{/* KPI skeletons */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[0, 1, 2, 3].map((i) => (
					<Card key={i} className="bg-[#0c0c0e]/90 border-white/10">
						<CardContent className="p-5">
							<div className="flex items-center gap-3">
								<Skeleton className="w-8 h-8 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-2.5 w-20 rounded" />
									<Skeleton className="h-7 w-16 rounded" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Chart skeleton */}
			<Card className="bg-[#0c0c0e]/90 border-white/10">
				<CardContent className="p-6">
					<Skeleton className="h-4 w-48 mb-6 rounded" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Skeleton className="h-[220px] w-full rounded-lg" />
						<Skeleton className="h-[220px] w-full rounded-lg" />
					</div>
					<div className="mt-5 space-y-2">
						{[0, 1, 2, 3, 4].map((j) => (
							<Skeleton key={j} className="h-8 w-full rounded" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function LostSalesReportView({
	report,
	isLoading,
}: LostSalesReportViewProps) {
	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (!report) {
		return <LoadingSkeleton />;
	}

	const { kpis, topParts, modelDemand } = report;

	if (topParts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-gray-500">
				<Package className="w-12 h-12 mb-4 opacity-30" />
				<p className="text-sm">No data available for the selected filters</p>
			</div>
		);
	}

	const partsChartData = topParts.slice(0, 10).map((p) => ({
		name: p.partNumber,
		value: p.orderCount,
		description: p.description,
		models: p.models,
	}));

	const modelsChartData = modelDemand
		.slice(0, 10)
		.map((m) => ({ name: m.model || "Unknown", value: m.orderCount }));

	return (
		<div className="space-y-3">
			{/* KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<KpiCard
					label="Total Orders"
					value={kpis.totalOrders}
					icon={<BarChart3 className="w-4 h-4" />}
				/>
				<KpiCard
					label="Distinct Parts"
					value={kpis.distinctParts}
					icon={<Package className="w-4 h-4" />}
				/>
				<KpiCard
					label="Total Quantity"
					value={kpis.totalQuantity}
					icon={<TrendingUp className="w-4 h-4" />}
				/>
				<KpiCard
					label="Distinct Models"
					value={kpis.distinctModels}
					icon={<Car className="w-4 h-4" />}
				/>
			</div>

			{/* Unified demand analysis section */}
			<SectionCard
				title="Demand Analysis"
				icon={<BarChart3 className="w-4 h-4" />}
			>
				<div className="grid grid-cols-1 md:grid-cols-5 gap-6">
					<div className="md:col-span-3">
						<p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">
							Top In-Demand Parts
						</p>
						<SectionChart data={partsChartData} />
					</div>
					<div className="md:col-span-2">
						<p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">
							By Car Model
						</p>
						<ModelsPieChart data={modelsChartData} />
					</div>
				</div>
				<div className="border-t border-white/10 mt-3" />
				<PartsTable rows={topParts.slice(0, 10)} />
			</SectionCard>
		</div>
	);
}
