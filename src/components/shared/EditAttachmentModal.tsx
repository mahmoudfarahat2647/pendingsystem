"use client";

import {
	Check,
	Copy,
	ExternalLink,
	File,
	Folder,
	LoaderCircle,
	Paperclip,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import {
	buildStorageObjectPath,
	getAttachmentsBucket,
	isSupportedAttachmentFile,
	isValidFileSize,
	sanitizeAttachmentLink,
	type AttachmentValue,
} from "@/lib/attachment";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

interface EditAttachmentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (value: AttachmentValue) => Promise<unknown> | unknown;
	orderId?: string;
	initialLink?: string;
	initialFilePath?: string;
	allowUpload: boolean;
}

export const EditAttachmentModal = ({
	open,
	onOpenChange,
	onSave,
	orderId,
	initialLink,
	initialFilePath,
	allowUpload,
}: EditAttachmentModalProps) => {
	const [linkValue, setLinkValue] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);
	const [fileMarkedForRemoval, setFileMarkedForRemoval] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!open) return;

		setLinkValue(initialLink || "");
		setSelectedFile(null);
		setIsDragging(false);
		setIsUploading(false);
		setHasCopied(false);
		setFileMarkedForRemoval(false);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [open, initialFilePath, initialLink]);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) {
				clearTimeout(copyTimeoutRef.current);
			}
		};
	}, []);

	const existingFilePath = fileMarkedForRemoval ? "" : initialFilePath || "";
	const existingFileName = existingFilePath.split("/").pop() || "";
	const selectedFileName = selectedFile?.name || "";
	const dropzoneDisabled = !allowUpload || isUploading;
	const canSave = Boolean(
		linkValue.trim() ||
			existingFilePath ||
			selectedFile ||
			initialLink?.trim() ||
			initialFilePath,
	);

	const currentFileUrl = useMemo(() => {
		if (!existingFilePath) return "";
		try {
			const supabase = getSupabaseBrowserClient();
			const bucket = getAttachmentsBucket();
			return supabase.storage.from(bucket).getPublicUrl(existingFilePath).data
				.publicUrl;
		} catch {
			return "";
		}
	}, [existingFilePath]);

	const resetFileInput = () => {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const validateFile = (file: File): boolean => {
		if (!isSupportedAttachmentFile(file)) {
			toast.error("Only JPG, PNG, and PDF files are supported.");
			return false;
		}

		if (!isValidFileSize(file)) {
			toast.error("File size must be 5MB or less.");
			return false;
		}

		return true;
	};

	const queueFile = (file: File) => {
		if (!validateFile(file)) {
			resetFileInput();
			return;
		}

		setSelectedFile(file);
		setFileMarkedForRemoval(Boolean(initialFilePath));
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		queueFile(file);
	};

	const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (dropzoneDisabled) return;

		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (!file) return;
		queueFile(file);
	};

	const handleLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLinkValue(sanitizeAttachmentLink(event.target.value));
	};

	const handleLinkPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
		event.preventDefault();
		const pastedText = event.clipboardData.getData("text");
		setLinkValue(sanitizeAttachmentLink(pastedText));
	};

	const handleCopy = async () => {
		const valueToCopy = linkValue.trim();
		if (!valueToCopy) return;

		try {
			await navigator.clipboard.writeText(valueToCopy);
			setHasCopied(true);
			if (copyTimeoutRef.current) {
				clearTimeout(copyTimeoutRef.current);
			}
			copyTimeoutRef.current = setTimeout(() => setHasCopied(false), 1600);
		} catch (error) {
			console.error("Failed to copy attachment link", error);
			toast.error("Failed to copy attachment link.");
		}
	};

	const deleteStoredFile = async (path: string) => {
		const supabase = getSupabaseBrowserClient();
		const bucket = getAttachmentsBucket();
		const { error } = await supabase.storage.from(bucket).remove([path]);

		if (error) {
			throw new Error(error.message);
		}
	};

	const uploadFile = async (file: File) => {
		if (!orderId) {
			throw new Error("File upload requires an existing order.");
		}

		const supabase = getSupabaseBrowserClient();
		const bucket = getAttachmentsBucket();
		const objectPath = buildStorageObjectPath(orderId, file);
		const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
			upsert: true,
			contentType: file.type,
		});

		if (error) {
			throw new Error(error.message);
		}

		return objectPath;
	};

	const handleClearState = () => {
		setLinkValue("");
		setSelectedFile(null);
		setFileMarkedForRemoval(Boolean(initialFilePath));
		resetFileInput();
	};

	const handleOpenExistingFile = () => {
		if (!currentFileUrl) return;
		window.open(currentFileUrl, "_blank", "noopener,noreferrer");
	};

	const handleSave = async () => {
		if (isUploading) return;

		const sanitizedLink = linkValue.trim()
			? sanitizeAttachmentLink(linkValue)
			: undefined;

		try {
			setIsUploading(true);

			let nextFilePath = existingFilePath || undefined;
			const shouldDeleteExistingFile =
				Boolean(initialFilePath) &&
				(fileMarkedForRemoval || (!selectedFile && !existingFilePath));

			if (selectedFile && initialFilePath) {
				await deleteStoredFile(initialFilePath);
			}

			if (selectedFile) {
				nextFilePath = await uploadFile(selectedFile);
			} else if (shouldDeleteExistingFile && initialFilePath) {
				await deleteStoredFile(initialFilePath);
				nextFilePath = undefined;
			}

			await onSave({
				attachmentLink: sanitizedLink,
				attachmentFilePath: nextFilePath,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to save attachment.";
			console.error("Attachment modal save failed", error);
			toast.error(message);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				hideClose={true}
				className="overflow-hidden border border-white/10 bg-[#151517] p-0 text-slate-200 shadow-2xl shadow-black/50 sm:max-w-[420px] rounded-2xl"
			>
				<DialogHeader className="border-b border-white/5 bg-white/[0.02] px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
								<Paperclip className="h-4 w-4 text-indigo-400" />
							</div>
							<DialogTitle className="text-base font-medium text-white">
								Attachments
							</DialogTitle>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleClearState}
								className="h-8 w-8 rounded-full text-slate-500 hover:bg-red-500/10 hover:text-red-400"
								disabled={isUploading}
							>
								<Trash2 className="h-3.5 w-3.5" />
								<span className="sr-only">Clear attachment fields</span>
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => onOpenChange(false)}
								className="h-8 w-8 rounded-full text-slate-500 hover:bg-white/10 hover:text-white"
								disabled={isUploading}
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Close attachment modal</span>
							</Button>
						</div>
					</div>
					<DialogDescription className="sr-only">
						Attach a file or save an external file path for this order.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 p-4 text-sm bg-[#121214]">
					{/* Dropzone */}
					<button
						type="button"
						className={cn(
							"group relative flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#161618] py-8 text-center transition-all",
							!dropzoneDisabled && "hover:border-indigo-500/30 hover:bg-indigo-500/5",
							isDragging && "border-indigo-500 bg-indigo-500/10",
							dropzoneDisabled && "cursor-not-allowed opacity-50 pointer-events-none"
						)}
						onClick={() => fileInputRef.current?.click()}
						onDragOver={(event) => {
							event.preventDefault();
							if (!dropzoneDisabled) {
								setIsDragging(true);
							}
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
						disabled={dropzoneDisabled}
					>
						<div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none rounded-xl" />
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							accept=".jpg,.jpeg,.png,.pdf"
							onChange={handleFileChange}
							disabled={dropzoneDisabled}
						/>

						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 shadow-inner ring-1 ring-white/10 transition-all group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/30">
							<Folder className="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-300" />
						</div>

						<p className="text-sm font-medium text-slate-200">
							Upload Image or PDF
						</p>
						<p className="mt-1 text-xs text-slate-500">
							Drag and drop or click to browse
						</p>
					</button>

					{/* File View */}
					{selectedFile && (
						<div className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
							<div className="flex items-center gap-3 overflow-hidden">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/20">
									<File className="h-4 w-4 text-indigo-300" />
								</div>
								<div className="min-w-0 flex-1 space-y-0.5 text-left">
									<p className="truncate text-sm font-medium text-slate-200">
										{selectedFileName}
									</p>
									<p className="text-[11px] text-indigo-200/50">
										{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to save
									</p>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedFile(null);
									setFileMarkedForRemoval(false);
									resetFileInput();
								}}
								className="ml-2 h-7 px-2 text-xs font-medium text-slate-400 hover:text-white"
								disabled={isUploading}
							>
								Remove
							</Button>
						</div>
					)}

					{!selectedFile && existingFilePath && (
						<div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
							<div className="flex items-center gap-3 overflow-hidden text-left">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
									<File className="h-4 w-4 text-slate-300" />
								</div>
								<div className="min-w-0 flex-1 space-y-0.5">
									<p className="truncate text-sm font-medium text-slate-200">
										{existingFileName}
									</p>
									<p className="text-[11px] text-slate-500">
										Saved in attachments
									</p>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleOpenExistingFile}
								className="ml-2 h-7 px-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
							>
								<ExternalLink className="mr-1.5 h-3 w-3" />
								Open
							</Button>
						</div>
					)}

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-xs font-medium text-slate-400">
								External Link
							</label>
						</div>
						<div className="relative">
							<Input
								value={linkValue}
								onChange={handleLinkChange}
								onPaste={handleLinkPaste}
								placeholder="Paste local path or URL..."
								disabled={isUploading}
								className="h-10 rounded-lg border-white/10 bg-black/20 pl-3 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0"
							/>
							<button
								type="button"
								onClick={handleCopy}
								disabled={!linkValue.trim() || isUploading}
								className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
							>
								{hasCopied ? (
									<Check className="h-3.5 w-3.5 text-emerald-400" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
								<span className="sr-only">Copy link</span>
							</button>
						</div>
					</div>
				</div>

				<DialogFooter className="border-t border-white/5 bg-[#151517] p-4 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isUploading}
						className="hidden sm:inline-flex h-10 px-4 text-sm font-medium text-slate-400 hover:text-white"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={!canSave || isUploading}
						className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600 disabled:bg-white/5 disabled:text-slate-500"
					>
						{isUploading ? (
							<span className="flex items-center gap-2">
								<LoaderCircle className="h-4 w-4 animate-spin" />
								Saving...
							</span>
						) : (
							"Save Changes"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
