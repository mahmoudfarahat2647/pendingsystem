"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useStore";

interface MoveToMainConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	count: number;
	onConfirm: () => void;
}

/**
 * Plain Yes / No confirmation for "Move to Main Sheet" (issue #314).
 *
 * Re-checks the `moveToMainPermission` Settings switch when Yes is clicked:
 * the switch can be turned off while the dialog is open, in which case the
 * move is aborted without changes. No / closing the dialog does nothing.
 */
export function MoveToMainConfirmDialog({
	open,
	onOpenChange,
	count,
	onConfirm,
}: MoveToMainConfirmDialogProps) {
	const { t } = useT();
	const moveToMainPermission = useAppStore((s) => s.moveToMainPermission);

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			onConfirm={() => {
				if (!moveToMainPermission) {
					toast.error(t("modals.moveToMain.permissionOff"));
					return;
				}
				onConfirm();
			}}
			variant="success"
			title={t("modals.stageConfirm.moveToMainTitle")}
			description={t("modals.stageConfirm.moveToMainDescription", { count })}
			confirmText={t("modals.stageConfirm.moveToMainYes")}
			cancelText={t("modals.stageConfirm.moveToMainNo")}
		/>
	);
}
