"use client";

import { Plus, Snowflake, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
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
import {
	useAddQuickTemplateMutation,
	useQuickTemplatesQuery,
	useRemoveQuickTemplateMutation,
} from "@/hooks/queries/useQuickTemplatesQuery";
import { useT } from "@/hooks/useT";

interface FreezeReasonModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (reason: string) => void;
}

export const FreezeReasonModal = ({
	open,
	onOpenChange,
	onSave,
}: FreezeReasonModalProps) => {
	const { t, lang } = useT();
	const { data: reasonTemplates = [] } = useQuickTemplatesQuery("reason");
	const addMutation = useAddQuickTemplateMutation("reason");
	const removeMutation = useRemoveQuickTemplateMutation("reason");
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
			addMutation.mutate(newTemplate.trim());
			setNewTemplate("");
			setIsAdding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative bg-sky-500/5">
					<div className="flex-1 flex justify-start">
						<div className="bg-sky-500/10 p-2 rounded-full">
							<Snowflake className="h-4 w-4 text-sky-400" />
						</div>
					</div>
					<DialogTitle className="text-lg font-medium text-sky-300">
						<LocalizedScope lang={lang}>
							{t("modals.freeze.title")}
						</LocalizedScope>
					</DialogTitle>
					<div className="flex-1" />
				</DialogHeader>

				<div className="p-6 space-y-4">
					<div className="space-y-2">
						<label
							htmlFor="freeze-reason"
							className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
						>
							<LocalizedScope lang={lang}>
								{t("modals.freeze.reasonLabel")}
							</LocalizedScope>
						</label>
						<div className="relative">
							<Textarea
								id="freeze-reason"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder={t("modals.freeze.reasonPlaceholder")}
								className="min-h-[120px] bg-[#2c2c2e] border-white/10 text-gray-200 resize-none focus-visible:ring-1 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0 placeholder:text-gray-600"
								maxLength={maxChars}
							/>
							<div className="absolute bottom-2 right-2 text-xs text-gray-500">
								{reason.length}/{maxChars}
							</div>
						</div>
						<p className="text-[11px] text-gray-500 italic">
							<LocalizedScope lang={lang}>
								{t("modals.freeze.hint")}
							</LocalizedScope>
						</p>
					</div>

					{/* Quick Templates Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
								<LocalizedScope lang={lang}>
									{t("modals.shared.quickTemplates")}
								</LocalizedScope>
							</h4>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsAdding(!isAdding)}
								className="h-6 px-2 text-sky-300 hover:text-sky-300/80 hover:bg-sky-400/10 text-[10px]"
							>
								<Plus className="h-3 w-3 mr-1" />
								<LocalizedScope lang={lang}>
									{isAdding ? t("common.cancel") : t("common.addNew")}
								</LocalizedScope>
							</Button>
						</div>

						{isAdding && (
							<div className="flex gap-2 mb-2">
								<Input
									value={newTemplate}
									onChange={(e) => setNewTemplate(e.target.value)}
									placeholder={t("modals.shared.newTemplatePlaceholder")}
									className="h-8 text-xs bg-[#2c2c2e] border-white/10 focus-visible:ring-sky-500/50"
									onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
								/>
								<Button
									size="sm"
									onClick={handleAddTemplate}
									className="h-8 bg-sky-500 text-white hover:bg-sky-600 px-3 text-xs"
								>
									<LocalizedScope lang={lang}>{t("common.add")}</LocalizedScope>
								</Button>
							</div>
						)}

						<div className="grid grid-cols-2 gap-2">
							{reasonTemplates.map((template) => (
								<div
									key={template.id}
									className="group relative flex items-center"
								>
									<Button
										variant="secondary"
										className="w-full justify-start text-[11px] h-8 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 border border-transparent hover:border-white/10 truncate pr-7"
										onClick={() => handleTemplateClick(template.text)}
									>
										{template.text}
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="absolute right-0.5 h-6 w-6 text-gray-500 hover:text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

				<DialogFooter className="p-6 pt-0 gap-3 sm:gap-0 sm:justify-between grid grid-cols-2">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						className="bg-[#2c2c2e] hover:bg-[#3c3c3e] text-gray-300 w-full"
					>
						<LocalizedScope lang={lang}>{t("common.cancel")}</LocalizedScope>
					</Button>
					<Button
						onClick={handleSave}
						disabled={!reason.trim()}
						className="bg-sky-500 hover:bg-sky-600 text-white font-medium w-full disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
					>
						<LocalizedScope lang={lang}>
							{t("modals.freeze.confirm")}
						</LocalizedScope>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
