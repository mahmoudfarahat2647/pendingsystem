"use client";

import { useCallback, useState } from "react";
import { type AttachmentValue, hasAttachment } from "@/lib/attachment";
import { normalizeOrderStage } from "@/lib/orderStage";
import {
	appendTaggedUserNote,
	getEffectiveNoteHistory,
} from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";

export type RowModalType =
	| "note"
	| "reminder"
	| "attachment"
	| "archive"
	| null;

const resolveRowStage = (row: PendingRow | null) =>
	normalizeOrderStage(row?.stage) ?? "main";

export const useRowModals = (
	onUpdate: (
		id: string,
		updates: Partial<PendingRow>,
		stage?: string,
	) => Promise<unknown> | undefined,
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

	const handleAttachClick = useCallback((row: PendingRow, tag?: string) => {
		setCurrentRow(row);
		setSourceTag(tag || "");
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
		setSourceTag("");
	}, []);

	const saveNote = useCallback(
		async (content: string) => {
			if (currentRow) {
				try {
					await onUpdate(
						currentRow.id,
						{ noteHistory: content },
						resolveRowStage(currentRow),
					);
					const { toast } = await import("sonner");
					toast.success("Note saved successfully");
					closeModal();
				} catch (error) {
					console.error("Failed to save note:", error);
					const { toast } = await import("sonner");
					toast.error("Failed to save note");
				}
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
				onUpdate(currentRow.id, { reminder }, resolveRowStage(currentRow));
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
		async (value: AttachmentValue) => {
			if (currentRow) {
				try {
					await onUpdate(
						currentRow.id,
						{
							attachmentLink: value.attachmentLink || undefined,
							attachmentFilePath: value.attachmentFilePath || undefined,
							hasAttachment: hasAttachment(value),
						},
						resolveRowStage(currentRow),
					);
					const { toast } = await import("sonner");
					toast.success("Attachment saved successfully");
					closeModal();
				} catch (error) {
					console.error("Failed to save attachment:", error);
					const { toast } = await import("sonner");
					toast.error("Failed to save attachment");
				}
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
				const combinedNote = appendTaggedUserNote(
					getEffectiveNoteHistory(currentRow),
					archiveReason,
					"archive",
				);

				onUpdate(
					currentRow.id,
					{
						status: "Archived",
						archiveReason: archiveReason,
						archivedAt: new Date().toISOString(),
						noteHistory: combinedNote,
					},
					resolveRowStage(currentRow),
				);
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
