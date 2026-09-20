"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ReleaseConfirmationModal } from "@/components/shared/ReleaseConfirmationModal";
import { normalizeVin } from "@/domain/order/orderWorkflow";
import {
	computeReleaseFollowUpDueDate,
	getQualifyingChassis,
	type ReleaseChassis,
} from "@/domain/order/releaseGate";
import {
	useClearReleaseFollowUpsMutation,
	useReleaseFollowUpsQuery,
	useUpsertReleaseFollowUpMutation,
} from "@/hooks/queries/useReleaseFollowUpsQuery";
import {
	type ReleaseGateApi,
	ReleaseGateContext,
	type ReleaseGateRequest,
	type ReleaseGateResult,
} from "@/hooks/useReleaseGate";
import { logger } from "@/lib/logger";

interface PendingPrompt {
	chassis: ReleaseChassis;
	resolve: (approved: boolean) => void;
}

/**
 * Owns eligibility, modal state, typed confirmation, and follow-up
 * operations for the release gate (issue #242). Mounted once, app-wide, in
 * `MainContentWrapper` — the same place the automatic VIN-move watcher runs.
 *
 * Every qualifying chassis across every caller is confirmed through exactly
 * one modal at a time: concurrent `requestCallRelease` calls are serialized
 * through a single promise chain (`queueRef`), and multiple qualifying VINs
 * within one call are presented sequentially, never as a multi-chassis list.
 */
export function ReleaseGateProvider({ children }: { children: ReactNode }) {
	const { data: followUps } = useReleaseFollowUpsQuery();
	const upsertFollowUp = useUpsertReleaseFollowUpMutation();
	const clearFollowUps = useClearReleaseFollowUpsMutation();

	const [prompt, setPrompt] = useState<PendingPrompt | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const queueRef = useRef<Promise<void>>(Promise.resolve());

	const openVinsWithFollowUp = useMemo(
		() => new Set((followUps ?? []).map((f) => normalizeVin(f.vin))),
		[followUps],
	);

	const promptForChassis = useCallback(
		(chassis: ReleaseChassis): Promise<boolean> => {
			const run = () =>
				new Promise<boolean>((resolve) => {
					setPrompt({ chassis, resolve });
				});
			const result = queueRef.current.then(run);
			// Keep the chain alive regardless of outcome.
			queueRef.current = result.then(
				() => undefined,
				() => undefined,
			);
			return result;
		},
		[],
	);

	const handleCancel = useCallback(async () => {
		if (!prompt) return;
		setSubmitting(true);
		try {
			// A chassis can qualify with a blank VIN (rowRequiresRelease doesn't
			// check VIN, and draft orders may legitimately have none yet).
			// release_follow_ups.vin is the table's primary key and the
			// repository rejects a blank one, so there is nothing to persist —
			// skip the upsert rather than let it throw. The trade-off is that a
			// blank-VIN chassis has no two-month follow-up to suppress a later
			// automatic re-prompt; it will simply be asked again.
			if (prompt.chassis.vin) {
				await upsertFollowUp.mutateAsync({
					vin: prompt.chassis.vin,
					nextDueAt: computeReleaseFollowUpDueDate(),
					referenceRowId: prompt.chassis.referenceRowId,
				});
			}
		} catch (error) {
			logger.warn(
				"[ReleaseGateProvider] Failed to schedule release follow-up:",
				error,
			);
		} finally {
			setSubmitting(false);
			prompt.resolve(false);
			setPrompt(null);
		}
	}, [prompt, upsertFollowUp]);

	const handleConfirm = useCallback(() => {
		if (!prompt) return;
		prompt.resolve(true);
		setPrompt(null);
	}, [prompt]);

	const requestCallRelease = useCallback(
		async (req: ReleaseGateRequest): Promise<ReleaseGateResult> => {
			const { rows, automatic } = req;
			const chassisList = getQualifyingChassis(rows);
			const qualifyingRowIds = new Set(chassisList.flatMap((c) => c.rowIds));

			const approvedRowIds = new Set(
				rows.filter((r) => !qualifyingRowIds.has(r.id)).map((r) => r.id),
			);
			const approvedVins: string[] = [];
			const cancelledVins: string[] = [];
			const skippedVins: string[] = [];

			for (const chassis of chassisList) {
				if (automatic && openVinsWithFollowUp.has(chassis.vin)) {
					// A cancelled automatic attempt stays suppressed until an explicit
					// new move attempt (manual action) or the follow-up clears.
					skippedVins.push(chassis.vin);
					continue;
				}

				const approved = await promptForChassis(chassis);
				if (approved) {
					for (const id of chassis.rowIds) approvedRowIds.add(id);
					approvedVins.push(chassis.vin);
				} else {
					cancelledVins.push(chassis.vin);
					// handleCancel already scheduled the follow-up.
				}
			}

			return {
				approvedRows: rows.filter((r) => approvedRowIds.has(r.id)),
				approvedVins,
				cancelledVins,
				skippedVins,
			};
		},
		[openVinsWithFollowUp, promptForChassis],
	);

	const clearFollowUpsForVins = useCallback(
		async (vins: string[]) => {
			if (vins.length === 0) return;
			await clearFollowUps.mutateAsync(vins);
		},
		[clearFollowUps],
	);

	const api = useMemo<ReleaseGateApi>(
		() => ({ requestCallRelease, clearFollowUpsForVins }),
		[requestCallRelease, clearFollowUpsForVins],
	);

	return (
		<ReleaseGateContext.Provider value={api}>
			{children}
			<ReleaseConfirmationModal
				open={prompt !== null}
				vin={prompt?.chassis.displayVin ?? ""}
				formattedMileage={prompt?.chassis.formattedMileage ?? ""}
				pending={submitting}
				onCancel={handleCancel}
				onConfirm={handleConfirm}
			/>
		</ReleaseGateContext.Provider>
	);
}
