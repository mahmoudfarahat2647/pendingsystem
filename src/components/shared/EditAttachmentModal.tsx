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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	buildStorageObjectPath,
	getAttachmentsBucket,
	isAtAttachmentLimit,
	isSupportedAttachmentFile,
	isValidFileSize,
	sanitizeAttachmentLink,
} from "@/lib/attachment";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

interface EditAttachmentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (filePaths: string[], link: string) => Promise<unknown> | unknown;
	orderId?: string;
	initialFilePaths?: string[];
	initialLink?: string;
	allowUpload?: boolean;
}

function getFileName(path: string): string {
	return path.split("/").pop() || path;
}

function getPublicUrl(path: string): string {
	try {
		const supabase = getSupabaseBrowserClient();
		const bucket = getAttachmentsBucket();
		return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
	} catch {
		return "";
	}
}

async function deleteFromStorage(path: string): Promise<void> {
	const supabase = getSupabaseBrowserClient();
	const bucket = getAttachmentsBucket();
	const { error } = await supabase.storage.from(bucket).remove([path]);
	if (error) throw new Error(error.message);
}

export const EditAttachmentModal = ({
	open,
	onOpenChange,
	onSave,
	orderId,
	initialFilePaths,
	initialLink,
	allowUpload = true,
}: EditAttachmentModalProps) => {
	// Working pill list — what will be passed to onSave
	const [paths, setPaths] = useState<string[]>([]);
	// Committed files the user removed — deleted from storage after successful save
	const [removedPaths, setRemovedPaths] = useState<string[]>([]);
	// Paths uploaded during this session — cleaned up on cancel
	const [sessionUploads, setSessionUploads] = useState<string[]>([]);
	const [uploadingFileName, setUploadingFileName] = useState<string | null>(
		null,
	);
	const [isDragging, setIsDragging] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [link, setLink] = useState("");
	const [hasCopied, setHasCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!open) return;
		setPaths(initialFilePaths ?? ([] as string[]));
		setRemovedPaths([]);
		setSessionUploads([]);
		setUploadingFileName(null);
		setIsDragging(false);
		setIsSaving(false);
		setError(null);
		setLink(initialLink ?? "");
		setHasCopied(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [open, initialFilePaths, initialLink]);

	const atLimit = isAtAttachmentLimit(paths);
	const isUploading = uploadingFileName !== null;
	const dropzoneDisabled = !allowUpload || isUploading || isSaving || atLimit;

	const uploadFile = async (file: File): Promise<string> => {
		if (!orderId) throw new Error("File upload requires an existing order.");
		const supabase = getSupabaseBrowserClient();
		const bucket = getAttachmentsBucket();
		const objectPath = buildStorageObjectPath(orderId, file);
		const { error: uploadError } = await supabase.storage
			.from(bucket)
			.upload(objectPath, file, { upsert: true, contentType: file.type });
		if (uploadError) throw new Error(uploadError.message);
		return objectPath;
	};

	const processFiles = async (files: FileList | File[]) => {
		const fileArray = Array.from(files);
		setError(null);
		let currentCount = paths.length;

		for (const file of fileArray) {
			if (currentCount >= 5) {
				toast.error("Maximum 5 files reached.");
				break;
			}
			if (!isSupportedAttachmentFile(file)) {
				setError("Only JPG, PNG, and PDF files are supported.");
				continue;
			}
			if (!isValidFileSize(file)) {
				setError("File size must be 5 MB or less.");
				continue;
			}
			setUploadingFileName(file.name);
			try {
				const path = await uploadFile(file);
				setPaths((prev) => [...prev, path]);
				setSessionUploads((prev) => [...prev, path]);
				currentCount++;
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Upload failed.";
				toast.error(`Failed to upload "${file.name}": ${msg}`);
			} finally {
				setUploadingFileName(null);
				if (fileInputRef.current) fileInputRef.current.value = "";
			}
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		await processFiles(files);
	};

	const handleDrop = async (e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (dropzoneDisabled) return;
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;
		await processFiles(files);
	};

	const handleRemove = async (path: string) => {
		setPaths((prev) => prev.filter((p) => p !== path));
		if (sessionUploads.includes(path)) {
			// Already in storage — delete immediately since the user never saved it
			setSessionUploads((prev) => prev.filter((p) => p !== path));
			try {
				await deleteFromStorage(path);
			} catch {
				// Non-fatal: orphaned file, storage cleanup can handle it
			}
		} else {
			// Was a previously saved file — defer storage deletion until after save
			setRemovedPaths((prev) => [...prev, path]);
		}
	};

	const handleCancel = async () => {
		if (isSaving) return;
		// Clean up files uploaded during this session that were never saved
		const toClean = [...sessionUploads];
		if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		onOpenChange(false);
		for (const path of toClean) {
			try {
				await deleteFromStorage(path);
			} catch {
				// Best effort
			}
		}
	};

	const handleSave = async () => {
		if (isSaving || isUploading) return;
		setIsSaving(true);
		try {
			await onSave(paths, link);
			// After successful save, clean up removed committed files from storage
			for (const path of removedPaths) {
				try {
					await deleteFromStorage(path);
				} catch {
					// Best effort — don't fail the save over storage cleanup
				}
			}
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "Failed to save attachments.";
			toast.error(msg);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleCancel();
			}}
		>
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
							<Badge
								variant="secondary"
								className="bg-white/5 text-slate-400 text-[11px] font-normal border-0"
							>
								{paths.length} / 5
							</Badge>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleCancel}
							disabled={isSaving}
							className="h-8 w-8 rounded-full text-slate-500 hover:bg-white/10 hover:text-white"
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</Button>
					</div>
					<DialogDescription className="sr-only">
						Attach up to 5 files (JPG, PNG, PDF) for this order.
					</DialogDescription>
				</DialogHeader>

				<div className="min-w-0 space-y-3 p-4 text-sm bg-[#121214]">
					{/* External Link */}
					<div className="space-y-1.5">
						<label
							htmlFor="external-link"
							className="text-xs font-medium text-slate-400"
						>
							External Link
						</label>
						<div className="relative flex items-center">
							<input
								id="external-link"
								type="text"
								value={link}
								onChange={(e) =>
									setLink(sanitizeAttachmentLink(e.target.value))
								}
								onPaste={(e) => {
									e.preventDefault();
									setLink(
										sanitizeAttachmentLink(e.clipboardData.getData("text")),
									);
								}}
								placeholder="Paste local path or URL…"
								disabled={isSaving}
								className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
							/>
							<div className="absolute right-1 flex items-center gap-0.5">
								{link && (
									<button
										type="button"
										onClick={() => setLink("")}
										disabled={isSaving}
										className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:pointer-events-none"
										title="Remove link"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
								<button
									type="button"
									onClick={() => {
										if (!link) return;
										navigator.clipboard.writeText(link);
										setHasCopied(true);
										if (copyTimeoutRef.current)
											clearTimeout(copyTimeoutRef.current);
										copyTimeoutRef.current = setTimeout(
											() => setHasCopied(false),
											2000,
										);
									}}
									disabled={!link || isSaving}
									className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition-colors disabled:pointer-events-none disabled:opacity-40"
									title="Copy link"
								>
									{hasCopied ? (
										<Check className="h-3.5 w-3.5 text-green-400" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Drop zone */}
					<button
						type="button"
						className={cn(
							"group relative flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#161618] py-7 text-center transition-all",
							!dropzoneDisabled &&
								"hover:border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer",
							isDragging && "border-indigo-500 bg-indigo-500/10",
							dropzoneDisabled &&
								"cursor-not-allowed opacity-50 pointer-events-none",
						)}
						onClick={() => !dropzoneDisabled && fileInputRef.current?.click()}
						onDragOver={(e) => {
							e.preventDefault();
							if (!dropzoneDisabled) setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
						disabled={dropzoneDisabled}
					>
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							accept=".jpg,.jpeg,.png,.pdf"
							multiple
							onChange={handleFileChange}
							disabled={dropzoneDisabled}
						/>
						<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-all group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/30">
							{isUploading ? (
								<LoaderCircle className="h-5 w-5 animate-spin text-indigo-400" />
							) : atLimit ? (
								<Paperclip className="h-5 w-5 text-slate-600" />
							) : (
								<Folder className="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-300" />
							)}
						</div>
						<p className="text-sm font-medium text-slate-300">
							{isUploading
								? `Uploading "${uploadingFileName}"…`
								: atLimit
									? "Limit reached"
									: "Drop files or click to browse"}
						</p>
						{!atLimit && !isUploading && (
							<p className="mt-1 text-xs text-slate-600">
								JPG, PNG, PDF · max 5 MB each
							</p>
						)}
					</button>

					{/* Error message */}
					{error && <p className="text-xs text-red-400">{error}</p>}

					{/* Pill list */}
					{paths.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{paths.map((path) => (
								<FilePill
									key={path}
									path={path}
									onRemove={handleRemove}
									disabled={isSaving || isUploading}
								/>
							))}
						</div>
					)}

					{/* Uploading spinner pill */}
					{uploadingFileName && (
						<div className="flex flex-wrap gap-2">
							<div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
								<LoaderCircle className="h-3 w-3 animate-spin" />
								<span className="max-w-[160px] truncate">
									{uploadingFileName}
								</span>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="border-t border-white/5 bg-[#151517] p-4 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						onClick={handleCancel}
						disabled={isSaving}
						className="hidden sm:inline-flex h-10 px-4 text-sm font-medium text-slate-400 hover:text-white"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={isSaving || isUploading}
						className="w-full sm:w-auto min-w-[120px] h-10 rounded-lg bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600 disabled:bg-white/5 disabled:text-slate-500"
					>
						{isSaving ? (
							<span className="flex items-center gap-2">
								<LoaderCircle className="h-4 w-4 animate-spin" />
								Saving…
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

interface FilePillProps {
	path: string;
	onRemove: (path: string) => void;
	disabled?: boolean;
}

function FilePill({ path, onRemove, disabled }: FilePillProps) {
	const name = getFileName(path);
	const url = getPublicUrl(path);

	return (
		<div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-2.5 pr-1.5 py-1.5 text-xs text-slate-300 max-w-[220px]">
			<File className="h-3 w-3 shrink-0 text-slate-500" />
			<span className="truncate flex-1">{name}</span>
			{url && (
				<button
					type="button"
					onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
					disabled={disabled}
					className="shrink-0 rounded-full p-0.5 text-slate-500 hover:text-indigo-400 transition-colors disabled:pointer-events-none"
					title="Open file"
				>
					<ExternalLink className="h-3 w-3" />
					<span className="sr-only">Open {name}</span>
				</button>
			)}
			<button
				type="button"
				onClick={() => onRemove(path)}
				disabled={disabled}
				className="shrink-0 rounded-full p-0.5 text-slate-500 hover:text-red-400 transition-colors disabled:pointer-events-none"
				title="Remove"
			>
				<X className="h-3 w-3" />
				<span className="sr-only">Remove {name}</span>
			</button>
		</div>
	);
}
