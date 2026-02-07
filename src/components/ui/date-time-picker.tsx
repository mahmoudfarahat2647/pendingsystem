"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/origin-calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/origin-select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
}

export default function DateTimePicker({ date, setDate }: DateTimePickerProps) {
	const [time, setTime] = React.useState({ h: "12", m: "00", ampm: "AM" });

	// Sync internal time state with controlled date prop when it changes
	React.useEffect(() => {
		if (date) {
			let h = date.getHours();
			const m = date.getMinutes();
			const ampm = h >= 12 ? "PM" : "AM";

			if (h > 12) h -= 12;
			if (h === 0) h = 12;

			const newH = h.toString().padStart(2, "0");
			const newM = m.toString().padStart(2, "0");

			setTime((prev) => {
				if (prev.h === newH && prev.m === newM && prev.ampm === ampm)
					return prev;
				return { h: newH, m: newM, ampm };
			});
		}
	}, [date]);

	const updateDate = (newDay: Date | undefined, timeParts: typeof time) => {
		if (!newDay) {
			if (date) setDate(undefined);
			return;
		}

		const d = new Date(newDay);
		let h = parseInt(timeParts.h);
		if (timeParts.ampm === "PM" && h < 12) h += 12;
		if (timeParts.ampm === "AM" && h === 12) h = 0;
		d.setHours(h, parseInt(timeParts.m), 0, 0);

		// Only update if different
		if (date?.getTime() !== d.getTime()) {
			setDate(d);
		}
	};

	const handleDaySelect = (newDay: Date | undefined) => {
		// Determine the base day.
		// If newDay is selected, we apply the CURRENT time state to it.
		// If newDay is undefined, we clear the date.
		updateDate(newDay, time);
	};

	const handleTimeChange = (part: keyof typeof time, val: string) => {
		const newTime = { ...time, [part]: val };
		setTime(newTime);

		// If we have a date selected, update it immediately with the new time
		if (date) {
			updateDate(date, newTime);
		}
		// If no date is selected, we just keep the time state for when a date IS selected.
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Date Picker */}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal border-white/10 bg-[#2c2c2e] text-gray-200 hover:bg-[#3c3c3e] hover:text-gray-100",
							!date && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date ? format(date, "PPP") : <span>Pick a date</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-0 w-fit border-white/10 bg-[#1c1c1e] text-white">
					<Calendar
						mode="single"
						selected={date}
						onSelect={handleDaySelect}
						initialFocus
					/>
				</PopoverContent>
			</Popover>

			{/* Time Picker */}
			<div className="flex items-center gap-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<Select value={time.h} onValueChange={(v) => handleTimeChange("h", v)}>
					<SelectTrigger className="w-[62px] border-white/10 bg-[#2c2c2e] text-gray-200">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-[#1c1c1e] border-white/10 text-gray-200">
						{Array.from({ length: 12 }, (_, i) => {
							const h = i + 1;
							return (
								<SelectItem
									key={h}
									value={h.toString().padStart(2, "0")}
									className="focus:bg-[#2c2c2e] focus:text-white"
								>
									{h.toString().padStart(2, "0")}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				<span className="text-gray-400">:</span>

				<Select value={time.m} onValueChange={(v) => handleTimeChange("m", v)}>
					<SelectTrigger className="w-[70px] border-white/10 bg-[#2c2c2e] text-gray-200">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-[#1c1c1e] border-white/10 text-gray-200">
						{["00", "15", "30", "45"].map((m) => (
							<SelectItem
								key={m}
								value={m}
								className="focus:bg-[#2c2c2e] focus:text-white"
							>
								{m}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={time.ampm}
					onValueChange={(v) => handleTimeChange("ampm", v)}
				>
					<SelectTrigger className="w-[70px] border-white/10 bg-[#2c2c2e] text-gray-200">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-[#1c1c1e] border-white/10 text-gray-200">
						<SelectItem
							value="AM"
							className="focus:bg-[#2c2c2e] focus:text-white"
						>
							AM
						</SelectItem>
						<SelectItem
							value="PM"
							className="focus:bg-[#2c2c2e] focus:text-white"
						>
							PM
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
