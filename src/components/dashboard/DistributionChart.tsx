"use client";

import { useId } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface DistributionChartProps {
	data: { name: string; value: number }[];
}

const DistributionChart = ({ data }: DistributionChartProps) => {
	const uid = useId();
	const filterId = `distributionChartDropShadow-${uid}`;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data}>
				<defs>
					<filter
						id={filterId}
						x="-20%"
						y="-20%"
						width="140%"
						height="140%"
					>
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
					stroke="none"
					filter={`url(#${filterId})`}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

export default DistributionChart;
