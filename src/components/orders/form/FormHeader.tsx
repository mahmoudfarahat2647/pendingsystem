"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus } from "lucide-react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormHeaderProps {
	isEditMode: boolean;
	isMultiSelection: boolean;
	selectedRowsCount: number;
	validationMode: "easy" | "beast";
	beastModeTimer: number | null;
}

/**
 * Header bar for the order form modal.
 * Displays mode icon, title, subtitle, and the beast mode countdown badge.
 */
export const FormHeader = ({
	isEditMode,
	isMultiSelection,
	selectedRowsCount,
	validationMode,
	beastModeTimer,
}: FormHeaderProps) => {
	return (
		<div className="relative overflow-hidden group">
			<div
				className={cn(
					"absolute inset-0 opacity-15 blur-xl transition-all duration-700",
					isEditMode ? "bg-amber-500" : "bg-indigo-500",
				)}
			/>
			<div
				className={cn(
					"relative px-6 py-4 border-b border-white/5 backdrop-blur-md flex items-center justify-between",
					isEditMode ? "bg-amber-500/10" : "bg-indigo-500/10",
				)}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"p-2 rounded-lg transition-colors duration-500 shadow-md",
							isEditMode
								? "bg-amber-500 text-black"
								: "bg-indigo-500 text-white",
						)}
					>
						{isEditMode ? (
							<Pencil className="h-4 w-4" />
						) : (
							<Plus className="h-4 w-4" />
						)}
					</div>
					<div>
						<DialogTitle className="text-lg font-bold tracking-tight text-white leading-none">
							{isEditMode
								? isMultiSelection
									? `Bulk Edit (${selectedRowsCount})`
									: "Modify Order"
								: "New Logistics Request"}
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider font-bold">
							{isMultiSelection
								? "Synchronizing batch metadata"
								: "Vehicle Repair Command Center"}
						</DialogDescription>
					</div>
				</div>

				<AnimatePresence>
					{validationMode === "beast" && beastModeTimer !== null && (
						<motion.div
							className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group cursor-default"
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -5 }}
						>
							<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-sm">
								<motion.div
									className={cn(
										"w-1.5 h-1.5 rounded-full",
										beastModeTimer > 10 ? "bg-amber-500/50" : "bg-red-500/50",
									)}
									animate={{
										scale: [1, 1.2, 1],
										opacity: [0.5, 0.8, 0.5],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								/>
								<span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
									Commit Window:
								</span>
								<span
									className={cn(
										"text-xs font-mono font-medium transition-colors duration-500",
										beastModeTimer > 10
											? "text-amber-500/70"
											: "text-red-500/70",
									)}
								>
									{beastModeTimer}s
								</span>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};
