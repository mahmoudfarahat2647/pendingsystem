"use client";

import { format } from "date-fns";
import { Bell, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DateTimePicker from "@/components/ui/date-time-picker";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useStore";

interface EditReminderModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: {
		date: string;
		time: string;
		subject: string;
	} | null;
	onSave: (
		data: { date: string; time: string; subject: string } | null | undefined,
	) => void;
}

export const EditReminderModal = ({
	open,
	onOpenChange,
	initialData,
	onSave,
}: EditReminderModalProps) => {
	const reminderTemplates = useAppStore((state) => state.reminderTemplates);
	const addReminderTemplate = useAppStore((state) => state.addReminderTemplate);
	const removeReminderTemplate = useAppStore(
		(state) => state.removeReminderTemplate,
	);

	const [dateTime, setDateTime] = useState<Date | undefined>();
	const [subject, setSubject] = useState("");
	const [isAddingTemplate, setIsAddingTemplate] = useState(false);
	const [newTemplate, setNewTemplate] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		if (open) {
			if (initialData?.date) {
				const dateStr = initialData.date;
				const timeStr = initialData.time || "12:00";
				// Construct date safely
				const d = new Date(`${dateStr}T${timeStr}`);
				if (!isNaN(d.getTime())) {
					setDateTime(d);
				} else {
					setDateTime(undefined);
				}
			} else {
				// Default to Today if no data
				setDateTime(new Date());
			}

			setSubject(initialData?.subject || "");
			setShowDeleteConfirm(false);
		}
	}, [open, initialData]);

	const handleSave = () => {
		if (dateTime) {
			const date = format(dateTime, "yyyy-MM-dd");
			const time = format(dateTime, "HH:mm");
			onSave({ date, time, subject });
		} else {
			// If cleared or invalid, defaulting to today
			onSave({
				date: format(new Date(), "yyyy-MM-dd"),
				time: "12:00",
				subject,
			});
		}
		onOpenChange(false);
	};

	const handleTemplateClick = (text: string) => {
		setSubject(text);
	};

	const handleAddTemplate = () => {
		if (newTemplate.trim()) {
			addReminderTemplate(newTemplate.trim());
			setNewTemplate("");
			setIsAddingTemplate(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative">
					<div className="flex-1 flex justify-start">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowDeleteConfirm(true)}
							className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
							title="Clear Reminder"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
					<DialogTitle className="text-lg font-medium flex items-center gap-2">
						<Bell className="h-5 w-5 text-renault-yellow" />
						Set Reminder
					</DialogTitle>
					<div className="flex-1" />
				</DialogHeader>

				<div className="relative">
					{/* Confirmation Overlay */}
					{showDeleteConfirm && (
						<div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#1c1c1e]/80 backdrop-blur-sm animate-in fade-in duration-200">
							<div className="bg-[#2c2c2e] border border-white/10 rounded-xl p-6 shadow-2xl w-full max-w-[280px] text-center space-y-4 animate-in zoom-in-95 duration-200 border-red-500/20">
								<div className="flex justify-center">
									<div className="bg-red-500/10 p-3 rounded-full">
										<Trash2 className="h-6 w-6 text-red-500" />
									</div>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-white">
										Clear Reminder?
									</h3>
									<p className="text-xs text-gray-400 mt-1">
										This will permanently remove the reminder from this row.
									</p>
								</div>
								<div className="flex gap-3">
									<Button
										variant="ghost"
										size="sm"
										className="flex-1 h-9 text-xs bg-[#3c3c3e] hover:bg-[#4c4c4e] text-gray-300"
										onClick={() => setShowDeleteConfirm(false)}
									>
										No
									</Button>
									<Button
										size="sm"
										className="flex-1 h-9 text-xs bg-red-500 hover:bg-red-600 text-white font-medium border-none shadow-lg shadow-red-500/20"
										onClick={() => {
											onSave(null);
											onOpenChange(false);
											setShowDeleteConfirm(false);
										}}
									>
										Yes, Clear
									</Button>
								</div>
							</div>
						</div>
					)}

					<div className="p-6 space-y-6">
						{/* Inputs Section */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-xs text-gray-400 uppercase tracking-wider">
									Date & Time
								</Label>
								<DateTimePicker date={dateTime} setDate={setDateTime} />
							</div>

							<div className="space-y-2">
								<Label className="text-xs text-gray-400 uppercase tracking-wider">
									Subject
								</Label>
								<Input
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									placeholder="What needs to be done?"
									className="bg-[#2c2c2e] border-white/10 text-gray-200 focus-visible:ring-1 focus-visible:ring-renault-yellow focus-visible:ring-offset-0"
								/>
							</div>
						</div>

						{/* Quick Templates Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
									QUICK TEMPLATES
								</h4>
								<button
									type="button"
									onClick={() => setIsAddingTemplate(!isAddingTemplate)}
									className="flex items-center text-renault-yellow hover:text-renault-yellow/80 text-xs transition-colors"
								>
									<Plus className="h-3 w-3 mr-1" />
									{isAddingTemplate ? "Cancel" : "Add New"}
								</button>
							</div>

							{isAddingTemplate && (
								<div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-1">
									<Input
										value={newTemplate}
										onChange={(e) => setNewTemplate(e.target.value)}
										placeholder="New template..."
										className="h-8 text-xs bg-[#2c2c2e] border-white/10"
										onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
									/>
									<Button
										size="sm"
										onClick={handleAddTemplate}
										className="h-8 bg-renault-yellow text-black hover:bg-renault-yellow/90"
									>
										Add
									</Button>
								</div>
							)}

							<div className="grid grid-cols-2 gap-2">
								{reminderTemplates.map((template, idx) => (
									<div
										key={`${template}-${idx}`}
										className="group relative flex items-center"
									>
										<button
											type="button"
											className="w-full text-left px-3 py-2 rounded-md text-xs bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border border-transparent hover:border-white/10 truncate pr-8 transition-colors"
											onClick={() => handleTemplateClick(template)}
										>
											{template}
										</button>
										<button
											type="button"
											className="absolute right-1 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
											onClick={(e) => {
												e.stopPropagation();
												removeReminderTemplate(template);
											}}
										>
											<Trash2 className="h-3 w-3" />
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="p-6 pt-0 gap-3 sm:gap-0 sm:justify-between grid grid-cols-2">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 w-full"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="bg-renault-yellow hover:bg-renault-yellow/90 text-black font-medium w-full"
					>
						Save Reminder
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
