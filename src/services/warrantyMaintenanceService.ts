import type { OrderStage } from "@/domain/order/orderStage";
import {
	getEffectiveEndWarranty,
	isWarrantyExpired,
} from "@/domain/order/warranty";
import { buildArchivePayload } from "@/lib/archivePayloadBuilder";
import { logger } from "@/lib/logger";
import { orderService } from "@/services/orderService";
import type { PendingRow } from "@/types";

const ACTIVE_STAGES = ["orders", "main", "call", "booking"] as const;
const WARRANTY_REPAIR_SYSTEM = "ضمان";
const ARCHIVE_REASON = "انتهاء فترة الضمان";

function findExpiredWarrantyRows(rows: PendingRow[]): PendingRow[] {
	return rows.filter((row) => {
		if (row.repairSystem !== WARRANTY_REPAIR_SYSTEM) return false;
		const effectiveEnd = getEffectiveEndWarranty(row);
		return effectiveEnd && isWarrantyExpired(effectiveEnd);
	});
}

export const warrantyMaintenanceService = {
	async archiveExpiredWarranties(): Promise<{
		archived: number;
		errors: number;
	}> {
		const results = await Promise.all(
			ACTIVE_STAGES.map((stage) =>
				orderService.fetchMappedOrders(stage as OrderStage),
			),
		);
		const expired = findExpiredWarrantyRows(results.flat());

		if (expired.length === 0) return { archived: 0, errors: 0 };

		let archived = 0;
		let errors = 0;

		for (const row of expired) {
			if (row.stage === "archive") continue;
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
