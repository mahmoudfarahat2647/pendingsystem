"use client";

import {
	ExternalLink,
	FileText,
	Folder,
	Paperclip,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface EditAttachmentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialPath?: string;
	onSave: (path: string | undefined) => void;
}

export const EditAttachmentModal = ({
	open,
	onOpenChange,
	initialPath,
	onSave,
}: EditAttachmentModalProps) => {
	const [path, setPath] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setPath(initialPath || "");
			setShowDeleteConfirm(false);
		}
	}, [open, initialPath]);

	const handleSave = () => {
		onSave(path.trim() || undefined);
		onOpenChange(false);
	};

	const handleOpen = () => {
		if (!path) return;
		// Check if it's a URL or a local path (basic check)
		if (path.startsWith("http://") || path.startsWith("https://")) {
			window.open(path, "_blank", "noopener,noreferrer");
		} else {
			// Local paths are tricky in browsers, but we'll show a toast or attempt a link
			// For now, we'll try to open it in a new tab which might trigger browser behavior for file:///
			window.open(
				path.startsWith("file://")
					? path
					: `file:///${path.replace(/\\/g, "/")}`,
				"_blank",
			);
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// In a real app, you'd upload this to a server.
			// For this simulation, we'll use the file name as the path or convert to Base64 if it's an image.
			setPath(file.name);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#1c1c1e] text-white border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b border-white/5 space-y-0 relative">
					<div className="flex-1 flex justify-start">
						{path && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowDeleteConfirm(true)}
								className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
								title="Remove Attachment"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
					<DialogTitle className="text-lg font-medium flex items-center gap-2">
						<Paperclip className="h-5 w-5 text-indigo-400" />
						Attachments
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
										Clear Attachment?
									</h3>
									<p className="text-xs text-gray-400 mt-1">
										This will permanently remove the link from this row.
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
											onSave(undefined);
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
						{/* Drop Zone / Selection Area */}
						<button
							type="button"
							className="w-full border-2 border-dashed border-indigo-500/30 rounded-2xl p-8 text-center space-y-4 hover:bg-indigo-500/5 transition-colors cursor-pointer group"
							onClick={() => fileInputRef.current?.click()}
						>
							<input
								type="file"
								className="hidden"
								ref={fileInputRef}
								onChange={handleFileUpload}
								accept=".pdf,image/*"
							/>
							<div className="flex justify-center gap-3">
								<div className="bg-white/5 p-3 rounded-xl group-hover:bg-white/10 transition-colors">
									<FileText className="h-6 w-6 text-slate-400" />
								</div>
								<div className="bg-indigo-500/10 p-4 rounded-xl -mt-2 shadow-lg shadow-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
									<Folder className="h-8 w-8 text-indigo-400" />
								</div>
								<div className="bg-white/5 p-3 rounded-xl group-hover:bg-white/10 transition-colors">
									<FileText className="h-6 w-6 text-slate-400" />
								</div>
							</div>
							<div className="space-y-1">
								<h3 className="text-sm font-semibold text-white">
									Link files or folders
								</h3>
								<p className="text-xs text-slate-500">
									(Paste file path or URL below)
								</p>
							</div>
						</button>

						{/* Path Input Section */}
						<div className="space-y-4">
							<div className="relative">
								<Input
									value={path}
									onChange={(e) => setPath(e.target.value)}
									placeholder="C:\Users\Documents\Order_123"
									className="h-12 bg-[#2c2c2e] border-white/5 text-gray-200 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 placeholder:text-slate-600"
								/>
							</div>

							{path && (
								<Button
									onClick={handleOpen}
									className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
								>
									<ExternalLink className="h-4 w-4" />
									Open Attachment Now
								</Button>
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="p-6 pt-0">
					<Button
						onClick={handleSave}
						variant="ghost"
						className="w-full h-12 bg-transparent border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white font-medium rounded-xl transition-all"
					>
						Save & Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
