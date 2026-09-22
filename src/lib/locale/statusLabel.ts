/**
 * Status label presentation rule (issue #269).
 *
 * Status labels are editable, so a built-in status still showing its
 * canonical default name and one an operator has renamed must be presented
 * differently:
 *
 * - A built-in status whose current label still equals its canonical
 *   default renders translated in the active locale.
 * - The moment an operator customizes a built-in status's label, that text
 *   is shown verbatim in every locale.
 * - A custom (operator-created) status is never translated — its id is not
 *   one of the built-in ids at all.
 *
 * This is presentation-only: it never reads or writes stored status
 * definitions, never changes a status id, and the stored `label` is left
 * completely untouched — callers still pass `status.label` (not this
 * function's return value) to any comparison, filter key, or mutation.
 *
 * `lib/` may depend on `domain/`, `schemas/`, and `types/` (see CLAUDE.md
 * "Architecture Standards"); this file additionally reads the translation
 * catalog (`src/locales/`), which is pure data + lookup logic with no
 * service/store/UI dependencies of its own.
 */

import type { Locale } from "@/domain/locale/locale";
import { BUILT_IN_STATUS_DEFAULT_LABELS } from "@/domain/status/statusDefaults";
import { translate } from "@/locales";
import type { TranslationKey } from "@/locales/types";

/** Minimal shape this resolver needs — works for `PartStatusDef` and friends. */
export interface StatusLabelSource {
	id: string;
	label: string;
}

/**
 * Maps each built-in status id to the translation key holding its
 * translated label. Deliberately not derived from
 * `BUILT_IN_STATUS_DEFAULT_LABELS` (domain/ cannot depend on the
 * locale-catalog types) — kept in sync by the `statusLabelKeys` coverage
 * test in `src/test/locale/statusLabel.test.ts`.
 */
const BUILT_IN_STATUS_TRANSLATION_KEYS: Readonly<
	Record<string, TranslationKey>
> = {
	no_stats: "statuses.partStatus.noStats",
	hold: "statuses.partStatus.hold",
	reserve: "statuses.partStatus.reserve",
	branch: "statuses.partStatus.branch",
	arrive: "statuses.partStatus.arrive",
	confirmed: "statuses.bookingStatus.confirmed",
	pending: "statuses.bookingStatus.pending",
	cancelled: "statuses.bookingStatus.cancelled",
	completed: "statuses.bookingStatus.completed",
};

/**
 * Resolves how a status's label should be *presented* in the given locale.
 *
 * Pure and side-effect free: never mutates `status`, never touches storage,
 * never changes `status.id`. Safe to call from grid cell renderers, filter
 * lists, menus, and the Settings status management section alike — the rule
 * is identical everywhere.
 */
export function resolveStatusLabel(
	status: StatusLabelSource,
	locale: Locale,
): string {
	const canonicalDefaultLabel = BUILT_IN_STATUS_DEFAULT_LABELS.get(status.id);
	const translationKey = BUILT_IN_STATUS_TRANSLATION_KEYS[status.id];

	const isUnmodifiedBuiltIn =
		canonicalDefaultLabel !== undefined &&
		translationKey !== undefined &&
		status.label === canonicalDefaultLabel;

	if (isUnmodifiedBuiltIn) {
		return translate(locale, translationKey);
	}

	// Customized built-in status, or a fully custom operator-created status:
	// always shown verbatim, in every locale.
	return status.label;
}

/**
 * Convenience form for the common case of resolving a label by matching a
 * raw status *value* (e.g. a grid cell's `row.status` string, or a filter's
 * `activeFilter` string) against a list of status definitions — the value
 * itself is never translated on its own, only via a matching definition.
 * Falls back to the raw value verbatim when no definition matches (custom
 * text, legacy data, etc.).
 */
export function resolveStatusLabelByValue(
	value: string,
	statuses: readonly StatusLabelSource[],
	locale: Locale,
): string {
	const match = statuses.find((s) => s.label === value);
	return match ? resolveStatusLabel(match, locale) : value;
}
