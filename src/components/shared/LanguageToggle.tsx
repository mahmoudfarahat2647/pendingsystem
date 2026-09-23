"use client";

import { useT } from "@/hooks/useT";
import type { Language } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";

const OPTIONS: {
	code: Language;
	shortKey: "settings.language.englishShort" | "settings.language.arabicShort";
	fullKey: "settings.language.english" | "settings.language.arabic";
	titleKey:
		| "settings.language.switchToEnglish"
		| "settings.language.switchToArabic";
}[] = [
	{
		code: "en",
		shortKey: "settings.language.englishShort",
		fullKey: "settings.language.english",
		titleKey: "settings.language.switchToEnglish",
	},
	{
		code: "ar",
		shortKey: "settings.language.arabicShort",
		fullKey: "settings.language.arabic",
		titleKey: "settings.language.switchToArabic",
	},
];

/**
 * `EN | AR` segmented language switch.
 *
 * Takes no lock props on purpose: it stays usable while Settings is
 * locked so anyone can switch languages.
 */
export const LanguageToggle = () => {
	const { t, lang } = useT();
	const setLanguage = useAppStore((s) => s.setLanguage);

	return (
		<fieldset className="m-0 flex min-w-0 items-center gap-0.5 rounded-lg border border-white/10 bg-black/40 p-0.5">
			<legend className="sr-only">{t("settings.language.label")}</legend>
			{OPTIONS.map((option) => {
				const active = lang === option.code;
				const label = t(option.titleKey);
				return (
					<button
						key={option.code}
						type="button"
						title={label}
						aria-label={label}
						aria-pressed={active}
						onClick={() => setLanguage(option.code)}
						className={cn(
							"h-7 min-w-11 rounded-md px-2 text-[11px] font-bold uppercase tracking-wider transition-colors",
							active
								? "bg-renault-yellow text-black shadow-lg shadow-renault-yellow/20"
								: "text-gray-400 hover:bg-white/5 hover:text-white",
						)}
					>
						{t(option.shortKey)}
						<span className="sr-only"> ({t(option.fullKey)})</span>
					</button>
				);
			})}
		</fieldset>
	);
};
