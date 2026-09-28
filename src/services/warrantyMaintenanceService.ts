import type { OrderStage } from "@/domain/order/orderStage";
import {
	isExpiredWarrantyRow,
	isProtectedRebook,
	WARRANTY_REPAIR_SYSTEM,
} from "@/domain/order/warranty";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { logger } from "@/lib/logger";
import { orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

const ACTIVE_STAGES = ["orders", "main", "call", "booking"] as const;
const ARCHIVE_REASON = "انتهاء فترة الضمان";

export function findExpiredWarrantyRows(rows: PendingRow[]): PendingRow[] {
	return rows.filter((row) => {
		if (isProtectedRebook(row)) return false;
		return isExpiredWarrantyRow(row);
	});
}

export const warrantyMaintenanceService = {
	async archiveExpiredWarranties(): Promise<{
		archived: number;
		errors: number;
	}> {
		const expiredAsOf = new Date();
		const results = await Promise.all(
			ACTIVE_STAGES.map((stage) =>
				// #250: repairSystem and conservative expiry candidacy are filtered
				// in the database. findExpiredWarrantyRows remains the final domain
				// check so archive behavior stays unchanged.
				orderService.fetchMappedOrdersByRepairSystem(
					stage as OrderStage,
					WARRANTY_REPAIR_SYSTEM,
					expiredAsOf,
				),
			),
		);
		const expired = findExpiredWarrantyRows(results.flat());

		if (expired.length === 0) return { archived: 0, errors: 0 };

		let archived = 0;
		let errors = 0;

		for (const row of expired) {
			// Archived and frozen rows are never active work: archived rows are
			// terminal, frozen rows are paused. Neither may be auto-archived by
			// background maintenance (freeze rows are not fetched via
			// ACTIVE_STAGES today; this guard is defense-in-depth).
			// Rebooked lines from archive are also exempt while in booking.
			if (
				row.stage === "archive" ||
				row.stage === "freeze" ||
				isProtectedRebook(row)
			)
				continue;
			try {
				const payload = buildArchivePayload(row, ARCHIVE_REASON);
				await orderService.saveOrder({
					...payload,
					id: row.id,
					stage: "archive",
					expectedCurrentStage: row.stage as Exclude<OrderStage, "archive">,
				});
				archived++;
			} catch (e) {
				logger.warn(
					`[warrantyMaintenance] Failed to archive row ${row.id}:`,
					e,
				);
				errors++;
			}
		}

		logger.debug(
			`[warrantyMaintenance] Done — archived: ${archived}, errors: ${errors}`,
		);
		return { archived, errors };
	},
};
