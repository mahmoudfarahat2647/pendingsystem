import { isUuid, normalizeVin } from "@/domain/order/orderWorkflow";
import { supabase as supabaseDefault } from "@/lib/supabase";
import { mapKeysToCamel } from "@/lib/utils";
import type { ReleaseFollowUp } from "@/schemas/releaseFollowUp.schema";
import { ReleaseFollowUpSchema } from "@/schemas/releaseFollowUp.schema";
import { handleSupabaseError, ServiceError } from "./orderServiceErrors";

const SELECT = "vin, next_due_at, reference_row_id, created_at, updated_at";

export function createReleaseFollowUpRepository(
	db: typeof supabaseDefault = supabaseDefault,
) {
	return {
		async list(): Promise<ReleaseFollowUp[]> {
			const { data, error } = await db
				.from("release_follow_ups")
				.select(SELECT);
			if (error) handleSupabaseError(error);
			return (data ?? []).map((row) => {
				const parsed = ReleaseFollowUpSchema.safeParse(
					mapKeysToCamel(row as Record<string, unknown>),
				);
				if (!parsed.success) {
					throw new ServiceError(
						"RELEASE_FOLLOW_UP_INVALID",
						"Invalid release follow-up row",
						parsed.error.flatten(),
					);
				}
				return parsed.data;
			});
		},

		/** Atomic upsert on the VIN primary key — single write. */
		async upsert(
			vin: string,
			nextDueAt: Date,
			referenceRowId?: string | null,
		): Promise<void> {
			const normalized = normalizeVin(vin);
			if (!normalized) {
				throw new ServiceError(
					"RELEASE_FOLLOW_UP_BLANK_VIN",
					"Cannot schedule a release follow-up for a blank VIN",
				);
			}
			// reference_row_id is a `uuid` column; a non-UUID value (e.g. a VIN
			// used as a notification's referenceId fallback when no row id was
			// available) would fail the write, so silently store null instead
			// of rejecting the whole upsert over an optional navigation hint.
			const sanitizedReferenceRowId =
				referenceRowId && isUuid(referenceRowId) ? referenceRowId : null;
			const { error } = await db.from("release_follow_ups").upsert(
				{
					vin: normalized,
					next_due_at: nextDueAt.toISOString(),
					reference_row_id: sanitizedReferenceRowId,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "vin" },
			);
			if (error) handleSupabaseError(error);
		},

		async clear(vins: string[]): Promise<void> {
			const normalized = vins.map((v) => normalizeVin(v)).filter(Boolean);
			if (normalized.length === 0) return;
			const { error } = await db
				.from("release_follow_ups")
				.delete()
				.in("vin", normalized);
			if (error) handleSupabaseError(error);
		},
	};
}

export const releaseFollowUpRepository = createReleaseFollowUpRepository();
