"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStage } from "@/domain/order/orderStage";
import { appendTaggedUserNote } from "@/domain/order/orderWorkflow";
import {
	useAddQuickTemplateMutation,
	useQuickTemplatesQuery,
	useRemoveQuickTemplateMutation,
} from "@/hooks/queries/useQuickTemplatesQuery";
import { useT } from "@/hooks/useT";

interface EditNoteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialContent: string;
	onSave: (content: string) => void;
	/** Undefined when the row's stage could not be resolved: notes stay
	 * editable, but quick templates are disabled rather than falling back to
	 * another stage's templates. */
	stage?: OrderStage;
	sourceTag?: string;
}

export const EditNoteModal = ({
	open,
	onOpenChange,
	initialContent,
	onSave,
	stage,
	sourceTag,
}: EditNoteModalProps) => {
	const { t, lang } = useT();
	const { data: noteTemplates = [] } = useQuickTemplatesQuery("note", stage);
	const addMutation = useAddQuickTemplateMutation("note", stage);
	const removeMutation = useRemoveQuickTemplateMutation("note", stage);
	const templatesEnabled = stage !== undefined;
	const [content, setContent] = useState("");
	const [newNote, setNewNote] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [newTemplate, setNewTemplate] = useState("");
	const [isHistoryLocked, setIsHistoryLocked] = useState(true);

	useEffect(() => {
		if (open) {
			setContent(initialContent || "");
			setNewNote("");
			setIsHistoryLocked(true);
		}
	}, [open, initialContent]);

	const handleSave = () => {
		let finalContent = isHistoryLocked ? initialContent || "" : content;
		if (newNote.trim()) {
			finalContent = appendTaggedUserNote(
				finalContent,
				newNote,
				sourceTag || "note",
			);
		}
		onSave(finalContent);
		onOpenChange(false);
	};

	const handleTemplateClick = (text: string) => {
		const updatedNote = newNote ? `${newNote}\n${text}` : text;
		setNewNote(updatedNote);
	};

	const handleAddTemplate = () => {
		if (newTemplate.trim()) {
			addMutation.mutate(newTemplate.trim());
			setNewTemplate("");
			setIsAdding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative">
					<div className="flex-1 flex justify-start"></div>
					<DialogTitle className="text-lg font-medium">
						<LocalizedScope lang={lang}>
							{t("modals.note.title")}
						</LocalizedScope>
					</DialogTitle>
					<DialogDescription className="sr-only">
						<LocalizedScope lang={lang}>
							{t("modals.note.srDescription")}
						</LocalizedScope>
					</DialogDescription>
					<div className="flex-1" />
				</DialogHeader>

				<div className="relative">
					<div className="p-6 space-y-6">
						{/* Existing Notes Section */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
									<LocalizedScope lang={lang}>
										{t("modals.note.existingNotes")}
									</LocalizedScope>
								</h4>
								{isHistoryLocked && content && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-gray-500 hover:text-renault-yellow hover:bg-renault-yellow/10"
												title={t("modals.note.editHistory")}
											>
												<Pencil className="h-3 w-3" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-sm">
											<AlertDialogHeader>
												<AlertDialogTitle className="text-sm">
													<LocalizedScope lang={lang}>
														{t("modals.note.editHistoryTitle")}
													</LocalizedScope>
												</AlertDialogTitle>
												<AlertDialogDescription className="text-xs text-gray-400">
													<LocalizedScope lang={lang}>
														{t("modals.note.editHistoryDescription")}
													</LocalizedScope>
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel className="bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border-none text-xs">
													<LocalizedScope lang={lang}>
														{t("modals.note.no")}
													</LocalizedScope>
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => setIsHistoryLocked(false)}
													className="bg-renault-yellow text-black hover:bg-renault-yellow/90 text-xs font-bold"
												>
													<LocalizedScope lang={lang}>
														{t("modals.note.yesUnlock")}
													</LocalizedScope>
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
							<div className="relative">
								<Textarea
									value={content}
									onChange={(e) => setContent(e.target.value)}
									readOnly={isHistoryLocked}
									placeholder={t("modals.note.emptyPlaceholder")}
									className={`min-h-[100px] border-white/5 text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin ${isHistoryLocked ? "bg-transparent text-gray-400 focus-visible:ring-0" : "bg-[#2c2c2e] text-gray-100 focus-visible:ring-1 focus-visible:ring-renault-yellow"}`}
								/>
							</div>
						</div>

						{/* New Note Section */}
						<div className="space-y-2">
							<h4 className="text-[10px] font-bold text-renault-yellow uppercase tracking-[0.2em]">
								<LocalizedScope lang={lang}>
									{t("modals.note.addNewNote")}
								</LocalizedScope>
							</h4>
							<div className="relative">
								<Textarea
									value={newNote}
									onChange={(e) => setNewNote(e.target.value)}
									placeholder={t("modals.note.newNotePlaceholder", {
										tag: String(sourceTag),
									})}
									className="min-h-[80px] bg-[#2c2c2e] border-white/10 text-gray-100 text-sm resize-none focus-visible:ring-1 focus-visible:ring-renault-yellow focus-visible:ring-offset-0"
									autoFocus
								/>
								<div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-mono">
									<LocalizedScope lang={lang}>
										{t("modals.note.autoTags", { tag: String(sourceTag) })}
									</LocalizedScope>
								</div>
							</div>
						</div>

						{/* Quick Templates Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
									<LocalizedScope lang={lang}>
										{t("modals.shared.quickTemplates")}
									</LocalizedScope>
								</h4>
								{templatesEnabled && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsAdding(!isAdding)}
										className="h-6 px-2 text-renault-yellow hover:text-renault-yellow/80 hover:bg-renault-yellow/10 text-[10px] font-bold"
									>
										<Plus className="h-3 w-3 mr-1" />
										<LocalizedScope lang={lang}>
											{isAdding
												? t("modals.note.cancelTemplate")
												: t("modals.note.addNewTemplate")}
										</LocalizedScope>
									</Button>
								)}
							</div>

							{!templatesEnabled && (
								<p className="text-[11px] text-gray-500 italic">
									<LocalizedScope lang={lang}>
										{t("modals.note.templatesUnavailable")}
									</LocalizedScope>
								</p>
							)}

							{templatesEnabled && isAdding && (
								<div className="flex gap-2 mb-2 animate-in slide-in-from-top-1 duration-200">
									<Input
										value={newTemplate}
										onChange={(e) => setNewTemplate(e.target.value)}
										placeholder={t("modals.note.templatePlaceholder")}
										className="h-8 text-xs bg-[#2c2c2e] border-white/10"
										onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
									/>
									<Button
										size="sm"
										onClick={handleAddTemplate}
										className="h-8 bg-renault-yellow text-black hover:bg-renault-yellow/90 text-[10px] font-bold"
									>
										<LocalizedScope lang={lang}>
											{t("modals.note.addTemplate")}
										</LocalizedScope>
									</Button>
								</div>
							)}

							<div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
								{(templatesEnabled ? noteTemplates : []).map((template) => (
									<div
										key={template.id}
										className="group relative flex items-center"
									>
										<Button
											variant="secondary"
											className="w-full justify-start text-[11px] h-9 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border border-transparent hover:border-white/10 truncate pr-8"
											onClick={() => handleTemplateClick(template.text)}
										>
											{template.text}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 h-6 w-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
											onClick={(e) => {
												e.stopPropagation();
												removeMutation.mutate(template.id);
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
						<LocalizedScope lang={lang}>
							{t("modals.note.cancel")}
						</LocalizedScope>
					</Button>
					<Button
						onClick={handleSave}
						className="bg-renault-yellow hover:bg-renault-yellow/90 text-black font-bold w-full text-xs"
					>
						<LocalizedScope lang={lang}>{t("modals.note.save")}</LocalizedScope>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
