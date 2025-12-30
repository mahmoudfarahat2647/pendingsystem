"use client";

import { Plus, Trash2 } from "lucide-react";
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

interface EditNoteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialContent: string;
	onSave: (content: string) => void;
	sourceTag?: string;
}

export const EditNoteModal = ({
	open,
	onOpenChange,
	initialContent,
	onSave,
	sourceTag,
}: EditNoteModalProps) => {
	const noteTemplates = useAppStore((state) => state.noteTemplates);
	const addNoteTemplate = useAppStore((state) => state.addNoteTemplate);
	const removeNoteTemplate = useAppStore((state) => state.removeNoteTemplate);
	const [content, setContent] = useState("");
	const [newNote, setNewNote] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [newTemplate, setNewTemplate] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const maxChars = 500; // Increased to accommodate multiple notes

	useEffect(() => {
		if (open) {
			setContent(initialContent || "");
			setNewNote("");
			setShowDeleteConfirm(false);
		}
	}, [open, initialContent]);

	const handleSave = () => {
		let finalContent = content;
		if (newNote.trim()) {
			const taggedNote = `${newNote.trim()} #${sourceTag || "note"}`;
			finalContent = finalContent
				? `${finalContent}\n${taggedNote}`
				: taggedNote;
		}
		onSave(finalContent);
		onOpenChange(false);
	};

	const handleTemplateClick = (text: string) => {
		const taggedText = `${text} #${sourceTag || "note"}`;
		const newContent = content ? `${content}\n${taggedText}` : taggedText;
		if (newContent.length <= maxChars) {
			setContent(newContent);
		}
	};

	const handleAddTemplate = () => {
		if (newTemplate.trim()) {
			addNoteTemplate(newTemplate.trim());
			setNewTemplate("");
			setIsAdding(false);
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
							title="Clear All Notes"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
					<DialogTitle className="text-lg font-medium">Notes</DialogTitle>
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
										Clear All Notes?
									</h3>
									<p className="text-xs text-gray-400 mt-1">
										This will permanently remove all notes from this row.
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
											onSave("");
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
						{/* Existing Notes Section */}
						<div className="space-y-2">
							<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
								EXISTING NOTES
							</h4>
							<div className="relative">
								<Textarea
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="No notes yet..."
									className="min-h-[100px] bg-transparent border-white/5 text-gray-400 text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
								/>
							</div>
						</div>

						{/* New Note Section */}
						<div className="space-y-2">
							<h4 className="text-[10px] font-bold text-renault-yellow uppercase tracking-[0.2em]">
								ADD NEW NOTE
							</h4>
							<div className="relative">
								<Textarea
									value={newNote}
									onChange={(e) => setNewNote(e.target.value)}
									placeholder={`Type a note for #${sourceTag}...`}
									className="min-h-[80px] bg-[#2c2c2e] border-white/10 text-gray-100 text-sm resize-none focus-visible:ring-1 focus-visible:ring-renault-yellow focus-visible:ring-offset-0"
									autoFocus
								/>
								<div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-mono">
									Auto-tags with #{sourceTag}
								</div>
							</div>
						</div>

						{/* Quick Templates Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
									QUICK TEMPLATES
								</h4>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsAdding(!isAdding)}
									className="h-6 px-2 text-renault-yellow hover:text-renault-yellow/80 hover:bg-renault-yellow/10 text-[10px] font-bold"
								>
									<Plus className="h-3 w-3 mr-1" />
									{isAdding ? "CANCEL" : "ADD NEW"}
								</Button>
							</div>

							{isAdding && (
								<div className="flex gap-2 mb-2 animate-in slide-in-from-top-1 duration-200">
									<Input
										value={newTemplate}
										onChange={(e) => setNewTemplate(e.target.value)}
										placeholder="Template text..."
										className="h-8 text-xs bg-[#2c2c2e] border-white/10"
										onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
									/>
									<Button
										size="sm"
										onClick={handleAddTemplate}
										className="h-8 bg-renault-yellow text-black hover:bg-renault-yellow/90 text-[10px] font-bold"
									>
										ADD
									</Button>
								</div>
							)}

							<div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
								{noteTemplates.map((template, idx) => (
									<div
										key={`${template}-${idx}`}
										className="group relative flex items-center"
									>
										<Button
											variant="secondary"
											className="w-full justify-start text-[11px] h-9 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border border-transparent hover:border-white/10 truncate pr-8"
											onClick={() => handleTemplateClick(template)}
										>
											{template}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 h-6 w-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
											onClick={(e) => {
												e.stopPropagation();
												removeNoteTemplate(template);
											}}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
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
						className="bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 w-full text-xs font-bold"
					>
						CANCEL
					</Button>
					<Button
						onClick={handleSave}
						className="bg-renault-yellow hover:bg-renault-yellow/90 text-black font-bold w-full text-xs"
					>
						SAVE NOTES
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
