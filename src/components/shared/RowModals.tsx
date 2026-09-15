"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getEffectiveNoteHistory } from "@/domain/order/orderWorkflow";
import type { RowModalType } from "@/hooks/useRowModals";
import { normalizeOrderStage } from "@/lib/orderStage";
import type { PendingRow } from "@/types";
import { ArchiveReasonModal } from "./ArchiveReasonModal";
import { EditAttachmentModal } from "./EditAttachmentModal";
import { EditNoteModal } from "./EditNoteModal";
import { EditReminderModal } from "./EditReminderModal";
import { FreezeReasonModal } from "./FreezeReasonModal";

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
	onSaveAttachment: (filePaths: string[], link: string) => void;
	onSaveArchive: (reason: string) => void;
	onSaveFreeze?: (reason: string) => void;
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
	onSaveFreeze,
	sourceTag,
}: RowModalsProps) => {
	const isNoteModalOpen = activeModal === "note";
	// Resolved without throwing (unlike resolveRowStage) so a row with a
	// missing/unrecognized stage never crashes the render for ANY modal type.
	// Deliberately NOT defaulted to a real stage: a wrong-but-valid stage
	// would let the Notes modal read, add and delete that stage's quick
	// templates, which is exactly the cross-tab contamination this scoping
	// work exists to prevent. EditNoteModal disables its templates section
	// when this is undefined.
	const resolvedStage = currentRow
		? normalizeOrderStage(currentRow.stage)
		: undefined;

	useEffect(() => {
		if (isNoteModalOpen && currentRow && !resolvedStage) {
			toast.error(
				"Could not determine this record's stage; quick templates are unavailable for this row.",
			);
		}
	}, [isNoteModalOpen, currentRow, resolvedStage]);

	if (!currentRow) return null;

	return (
		<>
			<EditNoteModal
				open={isNoteModalOpen}
				onOpenChange={(open) => !open && onClose()}
				initialContent={getEffectiveNoteHistory(currentRow)}
				onSave={onSaveNote}
				stage={resolvedStage}
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
				initialFilePaths={currentRow.attachmentFilePaths}
				initialLink={currentRow.attachmentLink}
				allowUpload={true}
				onSave={onSaveAttachment}
			/>
			<ArchiveReasonModal
				open={activeModal === "archive"}
				onOpenChange={(open) => !open && onClose()}
				onSave={onSaveArchive}
			/>
			{onSaveFreeze && (
				<FreezeReasonModal
					open={activeModal === "freeze"}
					onOpenChange={(open) => !open && onClose()}
					onSave={onSaveFreeze}
				/>
			)}
		</>
	);
};
