"use client";

import { createContext, useContext } from "react";
import type { PendingRow } from "@/schemas/order.schema";

export interface ReleaseGateRequest {
	rows: PendingRow[];
	/** True for background/inline auto-move producers; false for user-initiated actions. */
	automatic: boolean;
}

export interface ReleaseGateResult {
	/** Rows safe to move now: non-qualifying rows plus rows for released VINs. */
	approvedRows: PendingRow[];
	/** VINs that were confirmed with "release" in this call. */
	approvedVins: string[];
	/** VINs the user cancelled — a follow-up was scheduled for each. */
	cancelledVins: string[];
	/** Automatic-only: qualifying VINs skipped because a follow-up already exists. */
	skippedVins: string[];
}

export interface ReleaseGateApi {
	requestCallRelease: (req: ReleaseGateRequest) => Promise<ReleaseGateResult>;
	/** Clear any pending follow-up for VINs whose release-confirmed move just succeeded. */
	clearFollowUpsForVins: (vins: string[]) => Promise<void>;
}

const passthroughGate: ReleaseGateApi = {
	requestCallRelease: async ({ rows }) => ({
		approvedRows: rows,
		approvedVins: [],
		cancelledVins: [],
		skippedVins: [],
	}),
	clearFollowUpsForVins: async () => {},
};

export const ReleaseGateContext =
	createContext<ReleaseGateApi>(passthroughGate);

/**
 * Chassis-level "release" confirmation gate for moves into Call List
 * (issue #242). See `ReleaseGateProvider` for the implementation; a
 * passthrough default (no gating) is used outside the provider, e.g. in
 * tests that don't need it.
 */
export function useReleaseGate(): ReleaseGateApi {
	return useContext(ReleaseGateContext);
}
