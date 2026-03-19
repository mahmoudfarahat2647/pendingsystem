"use client";

import type { RowModalType } from "@/hooks/useRowModals";
import type { AttachmentValue } from "@/lib/attachment";
import { getEffectiveNoteHistory } from "@/lib/orderWorkflow";
import type { PendingRow } from "@/types";
import { ArchiveReasonModal } from "./ArchiveReasonModal";
import { EditAttachmentModal } from "./EditAttachmentModal";
import { EditNoteModal } from "./EditNoteModal";
import { EditReminderModal } from "./EditReminderModal";

interface RowModalsProps {
	activeModal: RowModalType;
	currentRow: PendingRow | null;
	onClose: () => void;
	onSaveNote: (content: string) => void;
	onSaveReminder: (
		reminder:
			| { date: string; time: string; subject: string }
			| null
			| undefined,
	) => void;
	onSaveAttachment: (value: AttachmentValue) => void;
	onSaveArchive: (reason: string) => void;
	sourceTag?: string;
}

export const RowModals = ({
	activeModal,
	currentRow,
	onClose,
	onSaveNote,
	onSaveReminder,
	onSaveAttachment,
	onSaveArchive,
	sourceTag,
}: RowModalsProps) => {
	if (!currentRow) return null;

	return (
		<>
			<EditNoteModal
				open={activeModal === "note"}
				onOpenChange={(open) => !open && onClose()}
				initialContent={getEffectiveNoteHistory(currentRow)}
				onSave={onSaveNote}
				sourceTag={sourceTag}
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
				orderId={currentRow.id}
				initialLink={currentRow.attachmentLink}
				initialFilePath={currentRow.attachmentFilePath}
				allowUpload={true}
				onSave={onSaveAttachment}
			/>
			<ArchiveReasonModal
				open={activeModal === "archive"}
				onOpenChange={(open) => !open && onClose()}
				onSave={onSaveArchive}
			/>
		</>
	);
};
