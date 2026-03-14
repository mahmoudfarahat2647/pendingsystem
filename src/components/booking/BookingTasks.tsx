"use client";

import { Clock, Gauge, ShieldCheck } from "lucide-react";
import {
	type PlayfulTodoItem,
	PlayfulTodolist,
} from "@/components/ui/playful-todolist";

/**
 * A temporary checklist component for the booking process.
 * Note: The checked state is held in memory only (via useBookingCalendar's
 * PlayfulTodolist) and will reset when refreshing the page or switching time slots.
 * This is intentional - state is not persisted to Supabase or localStorage.
 */
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

	const playfulItems: PlayfulTodoItem[] = tasks.map((task) => {
		const bgClass =
			task.id === "warranty"
				? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
				: task.id === "km"
					? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
					: "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500";

		return {
			id: task.id,
			checkboxClassName: `rounded-full border-white/20 ${bgClass}`,
			label: (
				<div className="flex items-center gap-3 w-full pl-1">
					<task.icon className={`h-4 w-4 ${task.color} opacity-70`} />
					<span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
						{task.label}
					</span>
				</div>
			),
		};
	});

	return (
		<div className="mt-8 space-y-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5 max-w-lg mx-auto w-full">
			<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
				Required Checks
			</h4>
			<PlayfulTodolist
				items={playfulItems}
				className="w-full space-y-3"
				itemClassName="flex items-center space-x-3 group cursor-pointer hover:bg-white/[0.02] p-2 rounded-lg transition-colors relative"
				hideDivider
			/>
		</div>
	);
};
