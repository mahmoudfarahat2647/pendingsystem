import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Shared round icon-button shape for the header's right-side actions. */
export function headerIconButtonClass(active: boolean) {
	return cn(
		"relative inline-flex items-center justify-center rounded-full p-2 transition-all",
		active
			? "text-black dark:text-white bg-black/10 dark:bg-white/10"
			: "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
	);
}

interface HeaderCountBadgeProps {
	count: number;
	className?: string;
}

/** Pill count badge pinned to the top-right corner of a header icon button. */
export function HeaderCountBadge({ count, className }: HeaderCountBadgeProps) {
	if (count <= 0) return null;

	return (
		<Badge
			className={cn(
				"absolute -top-1 -right-1 px-1.5 py-0 text-xs leading-4 text-white border-2 border-white dark:border-[#0a0a0b] pointer-events-none",
				className,
			)}
		>
			{count > 9 ? "9+" : count}
		</Badge>
	);
}
