"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmailTableRow } from "@/lib/clipboard/emailTable";
import { buildEmailTableClipboard } from "@/lib/clipboard/emailTable";
import { cn } from "@/lib/utils";

interface CopyForEmailButtonProps {
	rows: readonly EmailTableRow[];
}

export function CopyForEmailButton({ rows }: CopyForEmailButtonProps) {
	const isDisabled = rows.length === 0;

	const handleCopy = async () => {
		if (rows.length === 0) return;

		const ClipboardItemCtor = globalThis.ClipboardItem;
		const clipboard = navigator.clipboard;

		if (typeof ClipboardItemCtor === "undefined" || !clipboard?.write) {
			toast.error(
				"Formatted copy is not available in this browser. Nothing was copied.",
			);
			return;
		}

		const { html, text } = buildEmailTableClipboard(rows);

		try {
			await clipboard.write([
				new ClipboardItemCtor({
					"text/html": new Blob([html], { type: "text/html" }),
					"text/plain": new Blob([text], { type: "text/plain" }),
				}),
			]);
			toast.success(
				`Copied ${rows.length} row${rows.length === 1 ? "" : "s"} for email`,
			);
		} catch {
			toast.error(
				"Failed to copy for email. The browser blocked formatted copying.",
			);
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size="icon"
					variant="ghost"
					aria-label="Copy for Email"
					className={cn(
						"h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white",
						isDisabled && "opacity-50 cursor-not-allowed",
					)}
					onClick={() => {
						void handleCopy();
					}}
					disabled={isDisabled}
				>
					<Copy className="h-3.5 w-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Copy for Email</TooltipContent>
		</Tooltip>
	);
}
