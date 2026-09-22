import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LtrIsolateProps {
	children: ReactNode;
	className?: string;
	/** @default "span" */
	as?: ElementType;
}

/**
 * Forces left-to-right reading direction and bidirectional isolation for
 * identifiers that must never be reordered by RTL layout — VINs, part
 * numbers, phone numbers, tracking IDs, the release confirmation token (see
 * issue #265 acceptance criteria).
 *
 * Uses only the `dir` attribute and `unicode-bidi: isolate`; it never injects
 * bidi control characters (e.g. LRM/RLM), so text copied out of it is
 * byte-for-byte identical to the underlying value in both locales.
 */
export function LtrIsolate({ children, className, as }: LtrIsolateProps) {
	const Tag = as ?? "span";
	return (
		<Tag
			dir="ltr"
			style={{ unicodeBidi: "isolate" }}
			className={cn("text-left", className)}
		>
			{children}
		</Tag>
	);
}
