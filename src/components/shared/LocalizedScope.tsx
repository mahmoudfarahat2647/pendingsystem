"use client";

import type { ReactNode } from "react";
import type { Language } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

interface LocalizedScopeProps {
	lang: Language;
	children: ReactNode;
	className?: string;
}

/**
 * Scoped translation container for the Wave 1–5 areas (sidebar,
 * notifications, settings, action modals).
 *
 * Applies `lang`/`dir` plus the Arabic font to translated text only.
 * Wrap leaf text blocks — never flex/grid layout containers — so page
 * layout, icon positions and flex order stay LTR and pixel-identical.
 */
export const LocalizedScope = ({
	lang,
	children,
	className,
}: LocalizedScopeProps) => {
	if (lang === "en") {
		return <span className={className}>{children}</span>;
	}
	return (
		<span lang="ar" dir="rtl" className={cn("font-arabic", className)}>
			{children}
		</span>
	);
};
