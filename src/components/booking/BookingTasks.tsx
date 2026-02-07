"use client";

import { Clock, Gauge, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const BookingTasks = () => {
	const tasks = [
		{
			id: "warranty",
			label: "Warranty expired check",
			icon: ShieldCheck,
			color: "text-emerald-500",
		},
		{
			id: "km",
			label: "Kilometer check",
			icon: Gauge,
			color: "text-blue-500",
		},
		{
			id: "early",
			label: "Receiving next day and come earlier",
			icon: Clock,
			color: "text-amber-500",
		},
	];

	return (
		<div className="mt-8 space-y-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5 max-w-lg mx-auto w-full">
			<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
				Required Checks
			</h4>
			<div className="space-y-3">
				{tasks.map((task) => (
					<div
						key={task.id}
						className="flex items-center space-x-3 group cursor-pointer hover:bg-white-[0.02] p-2 rounded-lg transition-colors"
					>
						<Checkbox
							id={task.id}
							className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
						/>
						<div className="flex items-center gap-3">
							<task.icon className={`h-4 w-4 ${task.color} opacity-70`} />
							<Label
								htmlFor={task.id}
								className="text-sm text-gray-400 group-hover:text-gray-200 cursor-pointer transition-colors"
							>
								{task.label}
							</Label>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
