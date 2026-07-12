import type { PostgrestError } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase-admin";
import { handleSupabaseError } from "../orderServiceErrors";

// Same unfiltered embed used by the stage-fetch path (orderRepositorySelects.ts).
// CRITICAL: this must stay unfiltered. Filtering the embedded order_reminders
// array (e.g. via `order_reminders!inner(...)` with column filters applied to
// the embed itself) would change which reminder `mapSupabaseOrder` picks
// ("first uncompleted" in array order), producing a different managedKey and
// silently resurrecting notifications the user already dismissed.
const CANDIDATE_SELECT = `
	id,
	stage,
	order_number,
	customer_name,
	customer_email,
	customer_phone,
	vin,
	company,
	status,
	metadata,
	created_at,
	updated_at,
	order_reminders (*)
`;

function isoDateOnly(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function throwIfError(error: PostgrestError | null): void {
	if (error) handleSupabaseError(error);
}

function dedupeById(
	groups: Record<string, unknown>[][],
): Record<string, unknown>[] {
	const seen = new Set<string>();
	const result: Record<string, unknown>[] = [];
	for (const group of groups) {
		for (const row of group) {
			const id = row.id as string;
			if (seen.has(id)) continue;
			seen.add(id);
			result.push(row);
		}
	}
	return result;
}

/**
 * Fetches a small, server-filtered superset of order rows that MIGHT have a
 * currently-due reminder, warranty expiration, booking follow-up, or CNTR-RDG
 * warning. Every filter bound below is intentionally looser than the
 * matching client-side threshold in `notificationSlice.checkNotifications` —
 * the client re-checks each row exactly and is the sole source of truth for
 * "is this actually due". The server's only job is to shrink an
 * unbounded table scan down to a few dozen candidate rows.
 */
export function createNotificationCandidatesRepository(
	db: ReturnType<typeof createServiceClient> = createServiceClient(),
) {
	return {
		async getDueNotificationCandidates(): Promise<Record<string, unknown>[]> {
			const now = new Date();

			// --- Reminders: any non-archived order with an uncompleted reminder
			// due within the next minute (the +1min covers the client mapper's
			// minute-truncated local time comparison). Two-step so the candidacy
			// filter never shapes the embed returned for mapping (see comment above
			// CANDIDATE_SELECT).
			const reminderCutoff = new Date(now.getTime() + 60_000).toISOString();
			const reminderIdsQuery = await db
				.from("orders")
				.select("id, order_reminders!inner(id)")
				.neq("stage", "archive")
				.not("order_reminders.is_completed", "eq", true)
				.lte("order_reminders.remind_at", reminderCutoff)
				.order("created_at", { ascending: true })
				.order("id", { ascending: true });
			throwIfError(reminderIdsQuery.error);
			const reminderIds = (reminderIdsQuery.data ?? []).map(
				(row) => (row as { id: string }).id,
			);

			let reminderRows: Record<string, unknown>[] = [];
			if (reminderIds.length > 0) {
				const remindersQuery = await db
					.from("orders")
					.select(CANDIDATE_SELECT)
					.in("id", reminderIds)
					.order("created_at", { ascending: true })
					.order("id", { ascending: true });
				throwIfError(remindersQuery.error);
				reminderRows = (remindersQuery.data ?? []) as unknown as Record<
					string,
					unknown
				>[];
			}

			// --- Warranty: endWarranty within [-2d, +37d] of now — a superset of
			// the client's [0, 35] day window, padded for clock/date-parsing slack.
			const warrantyMin = isoDateOnly(
				new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
			);
			const warrantyMax = isoDateOnly(
				new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000),
			);
			const warrantyQuery = await db
				.from("orders")
				.select(CANDIDATE_SELECT)
				.neq("stage", "archive")
				.filter("metadata->>endWarranty", "neq", "")
				.filter("metadata->>endWarranty", "gte", warrantyMin)
				.filter("metadata->>endWarranty", "lte", warrantyMax)
				.order("created_at", { ascending: true })
				.order("id", { ascending: true });
			throwIfError(warrantyQuery.error);
			const warrantyRows = (warrantyQuery.data ?? []) as unknown as Record<
				string,
				unknown
			>[];

			// --- Booking follow-up: bookingDate <= tomorrow (1-day slack covers
			// the client's "day after at 10:00 local" rule across timezones).
			const bookingMax = isoDateOnly(
				new Date(now.getTime() + 24 * 60 * 60 * 1000),
			);
			const bookingQuery = await db
				.from("orders")
				.select(CANDIDATE_SELECT)
				.eq("stage", "booking")
				.filter("metadata->>bookingDate", "neq", "")
				.filter("metadata->>bookingDate", "lte", bookingMax)
				.order("created_at", { ascending: true })
				.order("id", { ascending: true });
			throwIfError(bookingQuery.error);
			const bookingRows = (bookingQuery.data ?? []) as unknown as Record<
				string,
				unknown
			>[];

			// --- CNTR-RDG warning: warranty-repair rows on Main Sheet created at
			// least 9 days ago — a superset of the tighter HIGH_RISK_DAYS=10
			// threshold (minus a day of floor/timezone slack). Numeric cntrRdg
			// thresholds (70k/85k) are applied client-side.
			const cntrCutoff = new Date(
				now.getTime() - 9 * 24 * 60 * 60 * 1000,
			).toISOString();
			const cntrQuery = await db
				.from("orders")
				.select(CANDIDATE_SELECT)
				.eq("stage", "main")
				.filter("metadata->>repairSystem", "eq", "ضمان")
				.lte("created_at", cntrCutoff)
				.order("created_at", { ascending: true })
				.order("id", { ascending: true });
			throwIfError(cntrQuery.error);
			const cntrRows = (cntrQuery.data ?? []) as unknown as Record<
				string,
				unknown
			>[];

			return dedupeById([reminderRows, warrantyRows, bookingRows, cntrRows]);
		},
	};
}
