import { env } from "./env";

export type AttachmentKind = "image-pdf" | "link";
export interface AttachmentValue {
	attachmentLink?: string;
	attachmentFilePath?: string;
}

const SUPPORTED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function isSupportedAttachmentFile(file: File): boolean {
	return SUPPORTED_MIME_TYPES.includes(file.type);
}

export function isValidFileSize(file: File): boolean {
	return file.size <= MAX_FILE_SIZE;
}

export function detectAttachmentKind(
	value: string | undefined,
	hasSelectedFile: boolean,
): AttachmentKind {
	if (hasSelectedFile) {
		return "image-pdf";
	}

	if (!value) {
		return "link";
	}

	const isUrl =
		value.startsWith("http://") ||
		value.startsWith("https://") ||
		value.startsWith("ftp://");

	const isImageUrl =
		isUrl &&
		(/\.(jpg|jpeg|png|gif|webp|pdf)(\?.*)?$/i.test(value) ||
			/(image\/|application\/pdf)/i.test(value));

	if (isImageUrl) {
		return "image-pdf";
	}

	return "link";
}

export function sanitizeAttachmentLink(value: string): string {
	const trimmed = value.trim();
	return trimmed.replace(/^"(.*)"$/, "$1");
}

export function buildStorageObjectPath(orderId: string, file: File): string {
	const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

	return `orders/${orderId}/${sanitizedName}`;
}

export function getAttachmentsBucket(): string {
	return env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET;
}

export function hasAttachment(value: AttachmentValue | null | undefined): boolean {
	return Boolean(
		value?.attachmentLink?.trim() || value?.attachmentFilePath?.trim(),
	);
}
