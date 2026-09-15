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
	// missing/unrecognized stage never crashes the render for ANY modal type
	// - only the Notes modal actually depends on this value, and even there
	// it falls back gracefully instead of blanking the page.
	const resolvedStage = currentRow
		? normalizeOrderStage(currentRow.stage)
		: undefined;
	const noteStage = resolvedStage ?? "orders";

	useEffect(() => {
		if (isNoteModalOpen && currentRow && !resolvedStage) {
			toast.error(
				"Could not determine this record's stage; showing default quick templates.",
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
				stage={noteStage}
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
