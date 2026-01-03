import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
	disabled?: boolean;
}

export const ColorPicker = ({
	color,
	onChange,
	disabled,
}: ColorPickerProps) => {
	const [isOpen, setIsOpen] = useState(false);

	// Predefined colors for quick selection
	const presetColors = [
		"#10b981", // emerald-500
		"#ef4444", // red-500
		"#3b82f6", // blue-500
		"#f59e0b", // amber-500
		"#8b5cf6", // violet-500
		"#ec4899", // pink-500
		"#06b6d4", // cyan-500
		"#eab308", // yellow-500
		"#f97316", // orange-500
		"#64748b", // slate-500
		"#71717a", // zinc-500
		"#737373", // neutral-500
	];

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					disabled={disabled}
					variant="outline"
					className={cn(
						"w-[80px] h-10 px-2 justify-between border-white/10 bg-black/40 hover:bg-white/5",
						disabled && "opacity-50 cursor-not-allowed",
					)}
				>
					<div
						className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
						style={{ backgroundColor: color }}
					/>
					<div className="text-[10px] text-gray-400 font-mono">
						{color.replace("#", "")}
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3 bg-[#18181b] border-white/10 space-y-3">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="text-xs font-medium text-gray-400">Select Color</h4>
						<Input
							value={color}
							onChange={(e) => onChange(e.target.value)}
							className="h-6 w-20 text-[10px] bg-black/40 border-white/10 px-1 py-0 font-mono text-center"
						/>
					</div>

					{/* Custom Color Input */}
					<div className="relative h-10 w-full rounded-lg overflow-hidden border border-white/10">
						<input
							type="color"
							value={color}
							onChange={(e) => onChange(e.target.value)}
							className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 m-0 cursor-pointer"
						/>
					</div>

					{/* Presets */}
					<div className="grid grid-cols-6 gap-1.5">
						{presetColors.map((preset) => (
							<button
								key={preset}
								type="button"
								className={cn(
									"w-7 h-7 rounded-md border border-white/5 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20",
									color.toLowerCase() === preset.toLowerCase() &&
										"ring-2 ring-white border-transparent",
								)}
								style={{ backgroundColor: preset }}
								onClick={() => onChange(preset)}
							>
								{color.toLowerCase() === preset.toLowerCase() && (
									<Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />
								)}
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
