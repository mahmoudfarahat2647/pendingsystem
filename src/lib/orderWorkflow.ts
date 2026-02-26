import type { PendingRow } from "@/types";

export const appendTaggedActionNote = (
	existing: string | undefined,
	note: string,
	tag: string,
): string => {
	const trimmedNote = note.trim();
	if (!trimmedNote) {
		return existing || "";
	}

	const taggedNote = `${trimmedNote} #${tag}`;
	return existing ? `${existing}\n${taggedNote}` : taggedNote;
};

export const getSelectedIds = (rows: PendingRow[]): string[] =>
	rows.map((row) => row.id);
