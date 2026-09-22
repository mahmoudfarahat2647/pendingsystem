/**
 * Canonical default definitions for the app's built-in statuses.
 *
 * These are the single source of truth for "what a built-in status looks
 * like before an operator ever touches it" — both the Zustand store's
 * initial `partStatuses`/`bookingStatuses` state (`src/store/slices/uiSlice.ts`)
 * and the status label presentation rule (`src/lib/locale/statusLabel.ts`,
 * issue #269) read from here so the two can never drift apart.
 *
 * Pure data only — no React/Supabase/env/localStorage (see CLAUDE.md
 * "Architecture Standards": domain/ depends only on types/).
 */
import type { PartStatusDef } from "@/types";

/** Built-in part-status definitions, in their canonical (never-customized) form. */
export const BUILT_IN_PART_STATUS_DEFAULTS: readonly PartStatusDef[] = [
	{ id: "no_stats", label: "Pending", color: "" },
	{ id: "hold", label: "Hold", color: "#3b82f6" },
	{ id: "reserve", label: "Reserve", color: "#8b5cf6" },
	{ id: "branch", label: "Branch", color: "#92400e" },
	{ id: "arrive", label: "Arrived", color: "#10b981" },
];

/** Built-in booking-status definitions, in their canonical (never-customized) form. */
export const BUILT_IN_BOOKING_STATUS_DEFAULTS: readonly PartStatusDef[] = [
	{ id: "confirmed", label: "Confirmed", color: "#10b981" },
	{ id: "pending", label: "Pending", color: "#facc15" },
	{ id: "cancelled", label: "Cancelled", color: "#ef4444" },
	{ id: "completed", label: "Completed", color: "#3b82f6" },
];

/** Every built-in status id (part + booking), combined — none overlap. */
export const BUILT_IN_STATUS_IDS: ReadonlySet<string> = new Set([
	...BUILT_IN_PART_STATUS_DEFAULTS.map((s) => s.id),
	...BUILT_IN_BOOKING_STATUS_DEFAULTS.map((s) => s.id),
]);

/** Canonical default label for every built-in status id, keyed by id. */
export const BUILT_IN_STATUS_DEFAULT_LABELS: ReadonlyMap<string, string> =
	new Map(
		[...BUILT_IN_PART_STATUS_DEFAULTS, ...BUILT_IN_BOOKING_STATUS_DEFAULTS].map(
			(s) => [s.id, s.label],
		),
	);
