"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface DistributionChartProps {
	data: { name: string; value: number }[];
}

export const DistributionChart = ({ data }: DistributionChartProps) => {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data}>
				<XAxis
					dataKey="name"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#6b7280", fontSize: 10 }}
					dy={10}
				/>
				<Tooltip
					cursor={{ fill: "rgba(255,255,255,0.05)" }}
					contentStyle={{
						backgroundColor: "#0a0a0b",
						borderColor: "rgba(255,255,255,0.1)",
						borderRadius: "8px",
					}}
				/>
				<Bar
					dataKey="value"
					fill="#FFCC00"
					radius={[4, 4, 0, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

export default DistributionChart;
