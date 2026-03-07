"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface CapacityChartProps {
	data: { name: string; value: number; color: string }[];
}

const CapacityChart = ({ data }: CapacityChartProps) => {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<defs>
					<filter id="chartDropShadow" x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
						<feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
					</filter>
				</defs>
				<Pie
					data={data}
					innerRadius={50}
					outerRadius={65}
					paddingAngle={5}
					cornerRadius={4}
					dataKey="value"
					stroke="none"
					filter="url(#chartDropShadow)"
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
