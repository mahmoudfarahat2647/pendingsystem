"use client";

import { type KeyboardEvent, useRef } from "react";
import type { Locale } from "@/domain/locale/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface LanguageOption {
	value: Locale;
	labelKey: "settings.language.english" | "settings.language.arabic";
}

const OPTIONS: LanguageOption[] = [
	{ value: "en", labelKey: "settings.language.english" },
	{ value: "ar", labelKey: "settings.language.arabic" },
];

/**
 * Settings > Language section. A two-option accessible control (native
 * language names) that applies immediately, with no reload and no shell
 * remount — see #263. Intentionally does not take an `isLocked` prop:
 * language is a presentation preference, independent of the Settings edit
 * lock (per #255's Implementation Decisions).
 *
 * Real `<input type="radio">` elements (visually hidden, semantically
 * present) back the styled labels so the control keeps native radio
 * semantics/keyboard support; the explicit arrow-key handler is an
 * enhancement on top, not a replacement for it.
 */
export const LanguageTab = () => {
	const { locale, setLocale, t } = useTranslation();
	const optionRefs = useRef<Array<HTMLInputElement | null>>([]);

	const selectAt = (index: number) => {
		const wrapped = (index + OPTIONS.length) % OPTIONS.length;
		const option = OPTIONS[wrapped];
		if (!option) return;
		setLocale(option.value);
		optionRefs.current[wrapped]?.focus();
	};

	const handleKeyDown = (
		event: KeyboardEvent<HTMLInputElement>,
		index: number,
	) => {
		if (
			event.key === "ArrowRight" ||
			event.key === "ArrowDown" ||
			event.key === "ArrowLeft" ||
			event.key === "ArrowUp"
		) {
			event.preventDefault();
			const direction =
				event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
			selectAt(index + direction);
		}
	};

	return (
		<div className="space-y-6">
			<div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
				<div
					role="radiogroup"
					aria-label={t("settings.language.sectionTitle")}
					className="flex gap-2"
				>
					{OPTIONS.map((option, index) => {
						const isSelected = locale === option.value;
						return (
							<label
								key={option.value}
								className={cn(
									"flex-1 flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
									"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-renault-yellow/80",
									isSelected
										? "bg-renault-yellow text-black shadow-lg shadow-renault-yellow/20"
										: "bg-black/30 text-gray-300 hover:bg-white/10 hover:text-white",
								)}
							>
								<input
									ref={(el) => {
										optionRefs.current[index] = el;
									}}
									type="radio"
									name="pending-sys-language"
									value={option.value}
									checked={isSelected}
									onChange={() => setLocale(option.value)}
									onKeyDown={(event) => handleKeyDown(event, index)}
									className="sr-only"
								/>
								{t(option.labelKey)}
							</label>
						);
					})}
				</div>
			</div>
		</div>
	);
};
