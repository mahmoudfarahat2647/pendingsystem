import type { ICellRendererParams } from "ag-grid-community";
import { Bell, History, Paperclip, StickyNote } from "lucide-react";
import type React from "react";
import type { PendingRow } from "@/types";

export const ActionCellRenderer = (params: ICellRendererParams<PendingRow>) => {
	const data = params.data;
	if (!data) return null;
	const isLocked = !!params.colDef?.cellRendererParams?.isLocked;

	const renderAction = (
		highlighted: boolean,
		title: string,
		Icon: React.ElementType,
		onClick?: () => void,
	) => {
		const highlightClass = highlighted
			? title === "Attachment"
				? "text-indigo-400"
				: "text-renault-yellow"
			: "text-gray-600";
		// Inline color fallback to ensure highlight is visible even if CSS specificity overrides Tailwind
		const colorStyle = highlighted
			? title === "Attachment"
				? { color: "#6366F1" }
				: { color: "#FFCC00" }
			: undefined;
		// When locked, remove hover and click affordances but keep highlight
		const baseClass = isLocked
			? highlightClass.replace("hover:text-gray-400", "")
			: `${highlightClass} hover:text-gray-400`;

		if (isLocked) {
			return (
				<span
					key={title}
					className={`transition-colors ${baseClass} opacity-95`}
					title={title}
					aria-disabled="true"
					style={{ ...(colorStyle || {}), pointerEvents: "none" }}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
			);
		}

		return (
			<button
				type="button"
				key={title}
				className={`transition-colors ${baseClass}`}
				title={title}
				onClick={() => onClick?.()}
				style={colorStyle}
			>
				<Icon className="h-3.5 w-3.5" />
			</button>
		);
	};

	return (
		<div className="flex items-center gap-3 h-full px-2">
			{renderAction(!!data.hasAttachment, "Attachment", Paperclip, () =>
				params.colDef?.cellRendererParams?.onAttachClick?.(data),
			)}

			{renderAction(!!data.actionNote, "Note", StickyNote, () =>
				params.colDef?.cellRendererParams?.onNoteClick?.(data),
			)}

			{renderAction(!!data.reminder, "Reminder", Bell, () =>
				params.colDef?.cellRendererParams?.onReminderClick?.(data),
			)}

			{isLocked ? (
				<span
					className="transition-colors text-gray-600 opacity-70"
					title="History"
					aria-disabled="true"
					style={{ pointerEvents: "none" }}
				>
					<History className="h-3.5 w-3.5" />
				</span>
			) : (
				<button
					type="button"
					className={`transition-colors text-gray-600 hover:text-gray-400`}
					title="History"
				>
					<History className="h-3.5 w-3.5" />
				</button>
			)}
		</div>
	);
};
