"use client";

import { Archive, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useStore";

interface ArchiveReasonModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (reason: string) => void;
}

export const ArchiveReasonModal = ({
	open,
	onOpenChange,
	onSave,
}: ArchiveReasonModalProps) => {
	const reasonTemplates = useAppStore((state) => state.reasonTemplates);
	const addReasonTemplate = useAppStore((state) => state.addReasonTemplate);
	const removeReasonTemplate = useAppStore(
		(state) => state.removeReasonTemplate,
	);
	const [reason, setReason] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [newTemplate, setNewTemplate] = useState("");
	const maxChars = 200;

	useEffect(() => {
		if (open) {
			setReason("");
		}
	}, [open]);

	const handleSave = () => {
		if (!reason.trim()) return;
		onSave(reason);
		onOpenChange(false);
	};

	const handleTemplateClick = (text: string) => {
		const newReason = reason ? `${reason}\n${text}` : text;
		if (newReason.length <= maxChars) {
			setReason(newReason);
		}
	};

	const handleAddTemplate = () => {
		if (newTemplate.trim()) {
			addReasonTemplate(newTemplate.trim());
			setNewTemplate("");
			setIsAdding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative bg-red-500/5">
					<div className="flex-1 flex justify-start">
						<div className="bg-red-500/10 p-2 rounded-full">
							<Archive className="h-4 w-4 text-red-500" />
						</div>
					</div>
					<DialogTitle className="text-lg font-medium text-red-400">
						Archive Record
					</DialogTitle>
					<div className="flex-1" />
				</DialogHeader>

				<div className="p-6 space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
							Reason for Archiving
						</label>
						<div className="relative">
							<Textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Please enter a reason for archiving this record..."
								className="min-h-[120px] bg-[#2c2c2e] border-white/10 text-gray-200 resize-none focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 placeholder:text-gray-600"
								maxLength={maxChars}
							/>
							<div className="absolute bottom-2 right-2 text-xs text-gray-500">
								{reason.length}/{maxChars}
							</div>
						</div>
						<p className="text-[11px] text-gray-500 italic">
							* Archiving will move this record to the archive history.
						</p>
					</div>

					{/* Quick Templates Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
								QUICK TEMPLATES
							</h4>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsAdding(!isAdding)}
								className="h-6 px-2 text-red-400 hover:text-red-400/80 hover:bg-red-400/10 text-[10px]"
							>
								<Plus className="h-3 w-3 mr-1" />
								{isAdding ? "Cancel" : "Add New"}
							</Button>
						</div>

						{isAdding && (
							<div className="flex gap-2 mb-2">
								<Input
									value={newTemplate}
									onChange={(e) => setNewTemplate(e.target.value)}
									placeholder="New template..."
									className="h-8 text-xs bg-[#2c2c2e] border-white/10 focus-visible:ring-red-500/50"
									onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
								/>
								<Button
									size="sm"
									onClick={handleAddTemplate}
									className="h-8 bg-red-500 text-white hover:bg-red-600 px-3 text-xs"
								>
									Add
								</Button>
							</div>
						)}

						<div className="grid grid-cols-2 gap-2">
							{reasonTemplates.map((template, idx) => (
								<div
									key={`${template}-${idx}`}
									className="group relative flex items-center"
								>
									<Button
										variant="secondary"
										className="w-full justify-start text-[11px] h-8 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border border-transparent hover:border-white/10 truncate pr-7"
										onClick={() => handleTemplateClick(template)}
									>
										{template}
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-0.5 h-6 w-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
										onClick={(e) => {
											e.stopPropagation();
											removeReasonTemplate(template);
										}}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							))}
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
						disabled={!reason.trim()}
						className="bg-red-500 hover:bg-red-600 text-white font-medium w-full disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
					>
						Confirm Archive
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
