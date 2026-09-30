"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { useT } from "@/hooks/useT";
import type { Language, TranslationKey } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";

interface LanguageOption {
	code: Language;
	glyph: string;
	/** Always shown in the language's own script — never translated. */
	nativeName: string;
	/** Name of the language in the current UI language. */
	nameKey: TranslationKey;
}

const OPTIONS: LanguageOption[] = [
	{
		code: "en",
		glyph: "Aa",
		nativeName: "English",
		nameKey: "settings.language.english",
	},
	{
		code: "ar",
		glyph: "ع",
		nativeName: "العربية",
		nameKey: "settings.language.arabic",
	},
];

/**
 * Language picker cards.
 *
 * Takes no lock props on purpose: it stays usable while Settings is
 * locked so anyone can switch languages.
 */
export const LanguageTab = () => {
	const { t, lang } = useT();
	const setLanguage = useAppStore((s) => s.setLanguage);
	const name = useId();

	return (
		<div className="flex flex-col gap-4 animate-in fade-in duration-500">
			<div className="rounded-xl border border-black/10 dark:border-white/10">
				<div className="px-4 pt-4">
					<h3 className="font-medium">
						<LocalizedScope lang={lang}>
							{t("settings.language.title")}
						</LocalizedScope>
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						<LocalizedScope lang={lang}>
							{t("settings.language.description")}
						</LocalizedScope>
					</p>
				</div>
				<div className="my-4 h-px w-full bg-black/10 dark:bg-white/10" />
				<div
					role="radiogroup"
					aria-label={t("settings.language.label")}
					className="grid gap-4 px-4 pb-6 sm:grid-cols-2 sm:px-8"
				>
					{OPTIONS.map((option) => {
						const isSelected = option.code === lang;
						const inputId = `${name}-${option.code}`;

						return (
							<label
								key={option.code}
								htmlFor={inputId}
								className={cn(
									"group relative flex cursor-pointer flex-col gap-4 rounded-xl border p-5 transition",
									"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-renault-yellow/70",
									isSelected
										? "border-renault-yellow bg-renault-yellow/5 ring-2 ring-renault-yellow/30"
										: "border-black/10 bg-black/[0.02] hover:border-black/25 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25",
								)}
							>
								<input
									type="radio"
									id={inputId}
									name={name}
									value={option.code}
									checked={isSelected}
									onChange={() => setLanguage(option.code)}
									aria-label={`${option.nativeName}, ${t(option.nameKey)}`}
									className="sr-only"
								/>
								<div className="flex items-start justify-between">
									<span
										aria-hidden="true"
										className={cn(
											"flex h-12 w-12 items-center justify-center rounded-lg border text-xl font-semibold",
											option.code === "ar" && "font-arabic",
											isSelected
												? "border-renault-yellow/40 bg-renault-yellow/15 text-yellow-700 dark:text-renault-yellow"
												: "border-black/10 bg-white text-gray-600 dark:border-white/10 dark:bg-black/30 dark:text-gray-300",
										)}
									>
										{option.glyph}
									</span>
									<span
										aria-hidden="true"
										className={cn(
											"flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
											isSelected
												? "border-renault-yellow bg-renault-yellow text-black"
												: "border-black/20 dark:border-white/20",
										)}
									>
										{isSelected && (
											<Check className="h-3.5 w-3.5" strokeWidth={3} />
										)}
									</span>
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="text-lg font-bold">
										<LocalizedScope lang={option.code}>
											{option.nativeName}
										</LocalizedScope>
									</span>
									<span className="text-sm text-muted-foreground">
										<LocalizedScope lang={lang}>
											{t(option.nameKey)}
										</LocalizedScope>
									</span>
								</div>
							</label>
						);
					})}
				</div>
			</div>
			<div className="flex flex-col gap-1 text-xs text-muted-foreground">
				<p>
					<LocalizedScope lang={lang}>
						{t("settings.language.appliesNote")}
					</LocalizedScope>
				</p>
				<p>
					<LocalizedScope lang={lang}>
						{t("settings.language.scopeNote")}
					</LocalizedScope>
				</p>
			</div>
		</div>
	);
};
