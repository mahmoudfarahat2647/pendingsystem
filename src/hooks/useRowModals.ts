"use client";

import { useCallback, useState } from "react";
import type { PendingRow } from "@/types";

export type RowModalType =
	| "note"
	| "reminder"
	| "attachment"
	| "archive"
	| null;

export const useRowModals = (
	onUpdate: (id: string, updates: Partial<PendingRow>) => void,
	onArchive?: (ids: string[], reason: string) => void,
) => {
	const [activeModal, setActiveModal] = useState<RowModalType>(null);
	const [currentRow, setCurrentRow] = useState<PendingRow | null>(null);
	const [targetIds, setTargetIds] = useState<string[]>([]);
	const [sourceTag, setSourceTag] = useState<string>("");

	const handleNoteClick = useCallback((row: PendingRow, tag?: string) => {
		setCurrentRow(row);
		setSourceTag(tag || "");
		setActiveModal("note");
	}, []);

	const handleReminderClick = useCallback((row: PendingRow) => {
		setCurrentRow(row);
		setActiveModal("reminder");
	}, []);

	const handleAttachClick = useCallback((row: PendingRow) => {
		setCurrentRow(row);
		setActiveModal("attachment");
	}, []);

	const handleArchiveClick = useCallback((row: PendingRow, ids?: string[]) => {
		setCurrentRow(row);
		setTargetIds(ids || [row.id]);
		setActiveModal("archive");
	}, []);

	const closeModal = useCallback(() => {
		setActiveModal(null);
		setCurrentRow(null);
		setTargetIds([]);
	}, []);

	const saveNote = useCallback(
		(content: string) => {
			if (currentRow) {
				onUpdate(currentRow.id, { actionNote: content });
				closeModal();
			}
		},
		[currentRow, onUpdate, closeModal],
	);

	const saveReminder = useCallback(
		(
			reminder:
				| { date: string; time: string; subject: string }
				| null
				| undefined,
		) => {
			if (currentRow) {
				onUpdate(currentRow.id, { reminder });
				closeModal();
				// Check for notifications immediately after setting a reminder
				// This ensures the notification appears if the reminder is already due
				setTimeout(() => {
					if (typeof window !== "undefined") {
						// Trigger a global notification check
						window.dispatchEvent(new Event("check-notifications"));
					}
				}, 100);
			}
		},
		[currentRow, onUpdate, closeModal],
	);

	const saveAttachment = useCallback(
		(path: string | undefined) => {
			if (currentRow) {
				onUpdate(currentRow.id, {
					attachmentPath: path,
					hasAttachment: !!path,
				});
				closeModal();
			}
		},
		[currentRow, onUpdate, closeModal],
	);

	const saveArchive = useCallback(
		(archiveReason: string) => {
			if (onArchive && targetIds.length > 0) {
				onArchive(targetIds, archiveReason);
				closeModal();
			} else if (currentRow) {
				const tag = "#archive";
				const reasonText = archiveReason.trim();
				const newNote = reasonText ? `${reasonText} ${tag}` : "";
				const combinedNote = currentRow.actionNote
					? reasonText
						? `${currentRow.actionNote}\n${newNote}`
						: currentRow.actionNote
					: newNote;

				onUpdate(currentRow.id, {
					status: "Archived",
					archiveReason: archiveReason,
					archivedAt: new Date().toISOString(),
					actionNote: combinedNote,
				});
				closeModal();
			}
		},
		[currentRow, targetIds, onArchive, onUpdate, closeModal],
	);

	return {
		activeModal,
		currentRow,
		handleNoteClick,
		handleReminderClick,
		handleAttachClick,
		handleArchiveClick,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
		sourceTag,
	};
};
