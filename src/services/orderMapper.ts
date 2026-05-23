import { hasAttachment } from "@/lib/attachment";
import { normalizeNullableCompanyName } from "@/lib/company";
import { PersistedOrderRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

/**
 * Maps a raw Supabase DB row into a validated `PendingRow` domain object.
 *
 * Throws if Zod validation fails so callers are immediately aware of any
 * mapping failure rather than propagating malformed data into app state.
 */
export function mapSupabaseOrder(row: Record<string, unknown>): PendingRow {
	// Map back the first active reminder if exists via the join
	let reminder: { date: string; time: string; subject: string } | null = null;
	if (
		row.order_reminders &&
		Array.isArray(row.order_reminders) &&
		row.order_reminders.length > 0
	) {
		// Find the first uncompleted one
		const active = row.order_reminders.find(
			(r: { is_completed: boolean; remind_at: string; title: string }) =>
				!r.is_completed,
		);
		if (active?.remind_at) {
			// Parse the remind_at timestamp back into date and time
			const remindAt = new Date(active.remind_at);
			// CRITICAL: Timezone Handling
			// Parse the UTC remind_at timestamp back into local time components.
			// We construct the "YYYY-MM-DD" string using local getFullYear/getMonth/getDate
			// to match the user's local day, reversing the logic used in saveOrder.
			const resultDate = [
				remindAt.getFullYear(),
				String(remindAt.getMonth() + 1).padStart(2, "0"),
				String(remindAt.getDate()).padStart(2, "0"),
			].join("-");

			reminder = {
				date: resultDate,
				time: remindAt.toTimeString().slice(0, 5), // .toTimeString() returns local time string
				subject: active.title || "",
			};
		}
	}

	const metadata =
		typeof row.metadata === "object" && row.metadata
			? (row.metadata as Record<string, unknown>)
			: {};
	const metadataAttachmentLink =
		typeof metadata.attachmentLink === "string" ? metadata.attachmentLink : "";
	const metadataAttachmentFilePath =
		typeof metadata.attachmentFilePath === "string"
			? metadata.attachmentFilePath
			: "";

	const legacyFilePath =
		(row.attachment_file_path as string) || metadataAttachmentFilePath;

	// Read the new array column; if empty and a legacy single path exists,
	// auto-migrate by treating it as a single-element array.
	const rawPaths = Array.isArray(row.attachment_file_paths)
		? (row.attachment_file_paths as string[])
		: [];
	const attachmentFilePaths =
		rawPaths.length === 0 && legacyFilePath ? [legacyFilePath] : rawPaths;

	const resultObj = {
		...metadata,
		id: row.id,
		trackingId: row.order_number,
		// Prefer the dedicated column value when non-empty; otherwise keep the
		// value already present in the metadata JSON (set during save).
		customerName: (row.customer_name as string) || metadata.customerName || "",
		mobile: (row.customer_phone as string) || metadata.mobile || "",
		vin: (row.vin as string) || metadata.vin || "",
		company: normalizeNullableCompanyName(row.company),
		attachmentLink: (row.attachment_link as string) || metadataAttachmentLink,
		attachmentFilePath: legacyFilePath,
		attachmentFilePaths,
		hasAttachment: hasAttachment({
			attachmentLink: (row.attachment_link as string) || metadataAttachmentLink,
			attachmentFilePath: legacyFilePath,
			attachmentFilePaths,
		}),
		reminder: reminder,
		stage: row.stage,
		createdAt: row.created_at as string | undefined,
	};

	// [CRITICAL] Strict Data Validation Mapping
	// This ensures all records entering the application state conform to the project's Zod schemas.
	// Bypassing or loosening these checks risks widespread data corruption and UI crashes.
	// Safe parse with Zod to validate and normalize data structure
	// This handles legacy field synchronization via the schema transform
	const parseResult = PersistedOrderRowSchema.safeParse(resultObj);
	if (!parseResult.success) {
		throw new Error(
			`[orderMapper] Row mapping failed for id=${row.id}: ${parseResult.error.issues.map((i: { message: string }) => i.message).join(", ")}`,
		);
	}

	return parseResult.data;
}
