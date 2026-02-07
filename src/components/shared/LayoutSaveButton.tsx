"use client";

import { Check, RotateCcw, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LayoutSaveButtonProps {
	isDirty: boolean;
	onSave: () => void;
	onSaveAsDefault: () => void;
	onReset: () => void;
	className?: string;
}

export function LayoutSaveButton({
	isDirty,
	onSave,
	onSaveAsDefault,
	onReset,
	className,
}: LayoutSaveButtonProps) {
	const [showConfirm, setShowConfirm] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const handleConfirmSave = () => {
		onSave();
		setShowConfirm(false);
		setDropdownOpen(false);
	};

	const handleOpenConfirm = () => {
		setShowConfirm(true);
		setDropdownOpen(false);
	};

	return (
		<div className={cn("flex items-center gap-1", className)}>
			<Popover open={showConfirm} onOpenChange={setShowConfirm} modal>
				<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
					<Tooltip>
						<DropdownMenuTrigger asChild>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-8 w-8 text-gray-400 hover:text-white transition-all",
										isDirty &&
											"text-renault animate-pulse bg-renault/10 hover:bg-renault/20",
									)}
								>
									<Save className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
						</DropdownMenuTrigger>
						<TooltipContent>Layout Arrangement</TooltipContent>
					</Tooltip>
					<DropdownMenuContent
						align="end"
						className="bg-[#1c1c1e] border-white/10 text-white min-w-[160px]"
					>
						<PopoverTrigger asChild>
							<DropdownMenuItem
								className="flex items-center gap-2 focus:bg-white/5 cursor-pointer disabled:opacity-50"
								disabled={!isDirty}
								onSelect={(e) => {
									e.preventDefault();
									if (isDirty) handleOpenConfirm();
								}}
							>
								<Save className="h-3.5 w-3.5 text-renault" />
								<span className="text-xs">Save Current Layout</span>
							</DropdownMenuItem>
						</PopoverTrigger>
						<DropdownMenuItem
							className="flex items-center gap-2 focus:bg-white/5 cursor-pointer text-blue-400 focus:text-blue-300 disabled:opacity-50"
							disabled={!isDirty}
							onClick={() => {
								if (isDirty) {
									onSaveAsDefault();
									setDropdownOpen(false);
								}
							}}
						>
							<Check className="h-3.5 w-3.5" />
							<span className="text-xs">Save as Default</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="flex items-center gap-2 focus:bg-white/5 cursor-pointer text-red-400 focus:text-red-300"
							onClick={() => {
								onReset();
								setDropdownOpen(false);
							}}
						>
							<RotateCcw className="h-3.5 w-3.5" />
							<span className="text-xs">Reset to Default</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<PopoverContent
					className="w-64 bg-[#1c1c1e] border-white/10 p-0 shadow-2xl"
					align="end"
				>
					<Card className="border-none bg-transparent shadow-none">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm font-medium text-white flex items-center gap-2">
								<Save className="h-4 w-4 text-renault" />
								Save Layout?
							</CardTitle>
						</CardHeader>
						<CardContent className="p-3 pt-0">
							<p className="text-xs text-gray-400">
								Are you sure you want to save this column arrangement for this
								session?
							</p>
						</CardContent>
						<CardFooter className="p-3 pt-0 flex justify-end gap-2">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs text-gray-400 hover:text-white"
								onClick={() => setShowConfirm(false)}
							>
								<X className="h-3 w-3 mr-1" />
								No
							</Button>
							<Button
								variant="renault"
								size="sm"
								className="h-7 text-xs"
								onClick={handleConfirmSave}
							>
								<Check className="h-3 w-3 mr-1" />
								Yes, Save
							</Button>
						</CardFooter>
					</Card>
				</PopoverContent>
			</Popover>
		</div>
	);
}
