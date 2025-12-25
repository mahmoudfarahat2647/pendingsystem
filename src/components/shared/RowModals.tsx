"use client";

import type { RowModalType } from "@/hooks/useRowModals";
import type { PendingRow } from "@/types";
import { EditAttachmentModal } from "./EditAttachmentModal";
import { EditNoteModal } from "./EditNoteModal";
import { EditReminderModal } from "./EditReminderModal";

interface RowModalsProps {
	activeModal: RowModalType;
	currentRow: PendingRow | null;
	onClose: () => void;
	onSaveNote: (content: string) => void;
	onSaveReminder: (
		reminder: { date: string; time: string; subject: string } | null | undefined,
	) => void;
	onSaveAttachment: (path: string | undefined) => void;
}

export const RowModals = ({
	activeModal,
	currentRow,
	onClose,
	onSaveNote,
	onSaveReminder,
	onSaveAttachment,
}: RowModalsProps) => {
	if (!currentRow) return null;

	return (
		<>
			<EditNoteModal
				open={activeModal === "note"}
				onOpenChange={(open) => !open && onClose()}
				initialContent={currentRow.actionNote || ""}
				onSave={onSaveNote}
			/>
			<EditReminderModal
				open={activeModal === "reminder"}
				onOpenChange={(open) => !open && onClose()}
				initialData={currentRow.reminder}
				onSave={onSaveReminder}
			/>
			<EditAttachmentModal
				open={activeModal === "attachment"}
				onOpenChange={(open) => !open && onClose()}
				initialPath={currentRow.attachmentPath}
				onSave={onSaveAttachment}
			/>
		</>
	);
};
