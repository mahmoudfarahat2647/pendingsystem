import { buildStorageObjectPath, getAttachmentsBucket } from "@/lib/attachment";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function getPublicUrl(path: string): string {
	try {
		const supabase = getSupabaseBrowserClient();
		const bucket = getAttachmentsBucket();
		return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
	} catch {
		return "";
	}
}

export async function deleteFromStorage(path: string): Promise<void> {
	const supabase = getSupabaseBrowserClient();
	const bucket = getAttachmentsBucket();
	const { error } = await supabase.storage.from(bucket).remove([path]);
	if (error) throw new Error(error.message);
}

export async function uploadToStorage(
	orderId: string,
	file: File,
): Promise<string> {
	if (!orderId) throw new Error("File upload requires an existing order.");
	const supabase = getSupabaseBrowserClient();
	const bucket = getAttachmentsBucket();
	const objectPath = buildStorageObjectPath(orderId, file);
	const { error: uploadError } = await supabase.storage
		.from(bucket)
		.upload(objectPath, file, { upsert: true, contentType: file.type });
	if (uploadError) throw new Error(uploadError.message);
	return objectPath;
}
