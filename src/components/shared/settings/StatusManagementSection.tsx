"use client";

import { Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PartStatusDef } from "@/types";
import { ColorPicker } from "../ColorPicker";

export interface StatusManagementSectionProps {
	title: string;
	managedTitle: string;
	statuses: PartStatusDef[];
	onAdd: (label: string, color: string) => void;
	onUpdate: (id: string, updates: Partial<PartStatusDef>) => void;
	onRemove: (id: string) => void;
	checkUsage: (label: string) => number;
	isLocked: boolean;
}

export const StatusManagementSection = ({
	title,
	managedTitle,
	statuses,
	onAdd,
	onUpdate,
	onRemove,
	checkUsage,
	isLocked,
}: StatusManagementSectionProps) => {
	const [newLabel, setNewLabel] = useState("");
	const [selectedColor, setSelectedColor] = useState("#10b981");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editLabel, setEditLabel] = useState("");
	const [editColor, setEditColor] = useState("");

	const startEditing = (status: PartStatusDef) => {
		setEditingId(status.id);
		setEditLabel(status.label);
		setEditColor(status.color);
	};

	const cancelEditing = () => {
		setEditingId(null);
		setEditLabel("");
		setEditColor("");
	};

	const saveEditing = (id: string) => {
		if (editLabel.trim()) {
			onUpdate(id, { label: editLabel.trim(), color: editColor });
			cancelEditing();
		}
	};

	return (
		<div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Add New Status */}
			<div
				className={cn(
					"p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative transition-all duration-300",
					isLocked && "grayscale pointer-events-none opacity-50",
				)}
			>
				{isLocked && (
					<div className="absolute inset-0 flex items-center justify-center z-20">
						<div className="px-3 py-1.5 bg-black/80 border border-white/10 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-sm">
							<Lock className="h-3 w-3 text-red-400" />
							<span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
								Editors Locked
							</span>
						</div>
					</div>
				)}
				<h4 className="text-sm font-semibold text-white uppercase tracking-wider">
					{title}
				</h4>
				<div className="flex gap-4">
					<Input
						value={newLabel}
						onChange={(e) => setNewLabel(e.target.value)}
						placeholder="Enter status label (e.g., In Transit)"
						className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-renault-yellow/50"
						disabled={isLocked}
					/>
					<Button
						onClick={() => {
							onAdd(newLabel, selectedColor);
							setNewLabel("");
						}}
						disabled={!newLabel.trim() || isLocked}
						className="h-12 px-6 bg-renault-yellow hover:bg-renault-yellow/90 text-black font-bold rounded-xl transition-all active:scale-95"
					>
						<Plus className="h-5 w-5 mr-2" />
						Add Status
					</Button>
				</div>
				<div className="space-y-3">
					<p className="text-xs font-medium text-gray-500 uppercase">
						Status Color
					</p>
					<ColorPicker
						color={selectedColor}
						onChange={setSelectedColor}
						disabled={isLocked}
					/>
				</div>
			</div>

			{/* List of Statuses */}
			<div className="space-y-4">
				<h4 className="text-sm font-semibold text-white uppercase tracking-wider px-2">
					{managedTitle}
				</h4>
				<div className="grid gap-3">
					{statuses.map((status) => {
						const isEditing = editingId === status.id;
						const usageCount = checkUsage(status.label);
						const isDeletable = usageCount === 0;

						if (isEditing) {
							return (
								<div
									key={status.id}
									className="p-4 rounded-2xl bg-white/10 border border-renault-yellow/50 ring-1 ring-renault-yellow/20 space-y-4 animate-in fade-in"
								>
									<div className="flex gap-4">
										<Input
											value={editLabel}
											onChange={(e) => setEditLabel(e.target.value)}
											className="h-10 bg-black/40 border-white/10"
											autoFocus
										/>
									</div>
									<div className="flex justify-between items-center">
										<ColorPicker color={editColor} onChange={setEditColor} />
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={cancelEditing}
												className="hover:bg-white/10 text-gray-400"
											>
												<X className="h-4 w-4 mr-1" />
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={() => saveEditing(status.id)}
												disabled={!editLabel.trim()}
												className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
											>
												<Check className="h-4 w-4 mr-1" />
												Save
											</Button>
										</div>
									</div>
								</div>
							);
						}

						return (
							<div
								key={status.id}
								className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
							>
								<div className="flex items-center gap-4">
									<div
										className={cn(
											"w-3 h-3 rounded-full shadow-lg",
											status.color.startsWith("bg-") && status.color,
										)}
										style={{
											backgroundColor: status.color.startsWith("bg-")
												? undefined
												: status.color,
										}}
									/>
									<span className="font-medium text-gray-200">
										{status.label}
									</span>
									{usageCount > 0 && (
										<span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
											{usageCount} used
										</span>
									)}
								</div>

								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => startEditing(status)}
										disabled={isLocked}
										className="h-9 w-9 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl"
									>
										<Pencil className="h-4 w-4" />
									</Button>

									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => onRemove(status.id)}
														disabled={isLocked || !isDeletable}
														className={cn(
															"h-9 w-9 rounded-xl transition-all",
															!isDeletable
																? "text-gray-600 cursor-not-allowed"
																: "text-gray-500 hover:text-red-400 hover:bg-red-400/10",
														)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</span>
											</TooltipTrigger>
											{!isDeletable && (
												<TooltipContent>
													<p>
														Cannot delete: Currently used by {usageCount} item
														{usageCount !== 1 ? "s" : ""}
													</p>
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
