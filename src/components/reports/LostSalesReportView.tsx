"use client";

import { BarChart3, Car, Package, TrendingUp } from "lucide-react";
import { useId } from "react";
import {
	Bar,
	BarChart,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
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

interface ChartData {
	name: string;
	value: number;
	description?: string;
	models?: string[];
}

interface SectionChartProps {
	data: ChartData[];
}

function PartsBarTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: Array<{ payload: ChartData }>;
}) {
	if (!active || !payload?.length) return null;
	const d = payload[0].payload;
	const modelLabel = d.models?.filter(Boolean).join(" / ") || null;
	return (
		<div
			style={{
				backgroundColor: "#0a0a0b",
				border: "1px solid rgba(255,255,255,0.1)",
				borderRadius: "8px",
				padding: "8px 12px",
				fontSize: "12px",
				color: "#e5e7eb",
			}}
		>
			<p style={{ fontWeight: 600 }}>{d.description || d.name}</p>
			{modelLabel && (
				<p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
					{modelLabel}
				</p>
			)}
			<p style={{ marginTop: "4px" }}>
				Count:{" "}
				<span style={{ fontWeight: 700, color: "#FFCC00" }}>{d.value}</span>
			</p>
		</div>
	);
}

function SectionChart({ data }: SectionChartProps) {
	const uid = useId();
	const filterId = `lostSalesDropShadow-${uid}`;

	return (
		<ResponsiveContainer width="100%" height={200}>
			<BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
				<defs>
					<filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow
							dx="0"
							dy="4"
							stdDeviation="6"
							floodColor="#000000"
							floodOpacity="0.4"
						/>
						<feDropShadow
							dx="0"
							dy="2"
							stdDeviation="2"
							floodColor="#000000"
							floodOpacity="0.6"
						/>
					</filter>
				</defs>
				<XAxis
					dataKey="name"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#6b7280", fontSize: 10 }}
					dy={10}
					interval={0}
					tickFormatter={(v: string) =>
						v.length > 12 ? `${v.slice(0, 12)}…` : v
					}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#6b7280", fontSize: 10 }}
					width={36}
				/>
				<Tooltip
					cursor={{ fill: "rgba(255,255,255,0.05)" }}
					content={<PartsBarTooltip />}
				/>
				<Bar
					dataKey="value"
					fill="#FFCC00"
					radius={[4, 4, 0, 0]}
					barSize={20}
					stroke="none"
					filter={`url(#${filterId})`}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}

// ---------------------------------------------------------------------------
// Internal: pie chart for model demand
// ---------------------------------------------------------------------------

const PIE_COLORS = [
	"#FFCC00",
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#DDA0DD",
	"#F4A460",
	"#87CEEB",
	"#F08080",
	"#90EE90",
];

function ModelsPieChart({ data }: SectionChartProps) {
	return (
		<ResponsiveContainer width="100%" height={200}>
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="45%"
					outerRadius={65}
					strokeWidth={0}
				>
					{data.map((_, idx) => (
						<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
					))}
				</Pie>
				<Tooltip
					cursor={false}
					contentStyle={{
						backgroundColor: "#0a0a0b",
						borderColor: "rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
						color: "#e5e7eb",
					}}
				/>
				<Legend
					iconSize={8}
					wrapperStyle={{ fontSize: "10px", color: "#9ca3af" }}
					formatter={(value: string) =>
						value.length > 14 ? `${value.slice(0, 14)}…` : value
					}
				/>
			</PieChart>
		</ResponsiveContainer>
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
		<Card className="bg-[#0c0c0e]/90 border-white/10">
			<CardContent className="p-5">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-renault-yellow/10 text-renault-yellow">
						{icon}
					</div>
					<div>
						<p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
							{label}
						</p>
						<p className="text-2xl font-black text-white">
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
			<CardContent className="p-6">
				<div className="flex items-center gap-2 mb-5">
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
		<div className="overflow-x-auto overflow-y-auto max-h-[180px] mt-5">
			<table className="w-full border-collapse text-xs text-gray-300">
				<thead>
					<tr className="border-b border-white/10">
						<th className="text-left py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							#
						</th>
						<th className="text-left py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							Part Number
						</th>
						<th className="text-left py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							Description
						</th>
						<th className="text-right py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							Order Count
						</th>
						<th className="text-right py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							Total Qty
						</th>
						<th className="text-left py-2 px-3 text-renault-yellow font-bold uppercase tracking-wider">
							Model
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((part, idx) => (
						<tr
							key={part.partNumber}
							className="border-b border-white/5 even:bg-white/5 hover:bg-white/[0.07] transition-colors"
						>
							<td className="py-2 px-3 text-gray-500">{idx + 1}</td>
							<td className="py-2 px-3 font-mono text-white/80">
								{part.partNumber}
							</td>
							<td className="py-2 px-3 text-gray-300 max-w-[260px] truncate">
								{part.description || "—"}
							</td>
							<td className="py-2 px-3 text-right text-white font-semibold">
								{part.orderCount.toLocaleString()}
							</td>
							<td className="py-2 px-3 text-right text-gray-400">
								{part.totalQuantity.toLocaleString()}
							</td>
							<td className="py-2 px-3 text-gray-400 max-w-[120px] truncate">
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

			{/* Chart skeletons */}
			{[0, 1].map((i) => (
				<Card key={i} className="bg-[#0c0c0e]/90 border-white/10">
					<CardContent className="p-6">
						<Skeleton className="h-4 w-48 mb-6 rounded" />
						<Skeleton className="h-[280px] w-full rounded-lg" />
						<div className="mt-5 space-y-2">
							{[0, 1, 2, 3, 4].map((j) => (
								<Skeleton key={j} className="h-8 w-full rounded" />
							))}
						</div>
					</CardContent>
				</Card>
			))}
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
		<div className="space-y-4">
			{/* KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

			{/* Two sections side by side */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{/* Top in-demand parts */}
				<SectionCard
					title="Top In-Demand Parts"
					icon={<BarChart3 className="w-4 h-4" />}
				>
					<SectionChart data={partsChartData} />
					<PartsTable rows={topParts.slice(0, 10)} />
				</SectionCard>

				{/* Demand by car model */}
				<SectionCard
					title="Demand by Car Model"
					icon={<Car className="w-4 h-4" />}
				>
					<ModelsPieChart data={modelsChartData} />
				</SectionCard>
			</div>
		</div>
	);
}
