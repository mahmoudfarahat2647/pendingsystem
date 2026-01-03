import type { ICellRendererParams } from "ag-grid-community";
import { Bell, Paperclip, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingRow } from "@/types";

// Action Cell Renderer - shows icons for attachment, note, history
export const ActionCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;

	const isLocked = params.colDef?.cellRendererParams?.isLocked;

	return (
		<div
			className={cn(
				"flex items-center justify-center w-full gap-3 h-full px-2",
				isLocked && "pointer-events-none",
			)}
		>
			<button
				type="button"
				className={`transition-colors ${data.hasAttachment ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}
				title="Attachment"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onAttachClick) {
						params.colDef.cellRendererParams.onAttachClick(data);
					}
				}}
			>
				<Paperclip className="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				className={`transition-colors ${data.actionNote ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
				title="Note"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onNoteClick) {
						params.colDef.cellRendererParams.onNoteClick(data);
					}
				}}
			>
				<StickyNote className="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				className={`transition-colors ${data.reminder ? "text-renault-yellow" : "text-gray-600 hover:text-gray-400"}`}
				title="Reminder"
				disabled={isLocked}
				onClick={() => {
					if (params.colDef?.cellRendererParams?.onReminderClick) {
						params.colDef.cellRendererParams.onReminderClick(data);
					}
				}}
			>
				<Bell className="h-3.5 w-3.5" />
			</button>
		</div>
	);
};
