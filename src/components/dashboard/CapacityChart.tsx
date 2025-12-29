"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface CapacityChartProps {
	data: { name: string; value: number; color: string }[];
}

export const CapacityChart = ({ data }: CapacityChartProps) => {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={data}
					innerRadius={60}
					outerRadius={80}
					paddingAngle={5}
					dataKey="value"
					stroke="none"
				>
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={entry.color} />
					))}
				</Pie>
			</PieChart>
		</ResponsiveContainer>
	);
};

export default CapacityChart;
