"use client";

import { LocalizedScope } from "@/components/shared/LocalizedScope";
import {
	DarkThemePreview,
	WhiteThemePreview,
} from "@/components/ui/theme-previews";
import {
	ThemeToggle,
	type ThemeToggleOption,
} from "@/components/ui/theme-toggle";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";

export const ThemeTab = () => {
	const { t, lang } = useT();
	const { theme, setTheme } = useTheme();

	const options: ThemeToggleOption<Theme>[] = [
		{
			value: "white",
			label: (
				<LocalizedScope lang={lang}>{t("settings.theme.white")}</LocalizedScope>
			),
			preview: WhiteThemePreview,
			surfaceClassName: "bg-gray-50 dark:bg-gray-100",
		},
		{
			value: "dark",
			label: (
				<LocalizedScope lang={lang}>{t("settings.theme.dark")}</LocalizedScope>
			),
			preview: DarkThemePreview,
			surfaceClassName: "bg-neutral-900 dark:bg-[#141416]",
		},
	];

	return (
		<div className="flex flex-col gap-4 animate-in fade-in duration-500">
			<div className="rounded-xl border border-black/10 dark:border-white/10">
				<div className="px-4 pt-4">
					<h3 className="font-medium">
						<LocalizedScope lang={lang}>
							{t("settings.theme.title")}
						</LocalizedScope>
					</h3>
					<p className="text-sm text-muted-foreground mt-1">
						<LocalizedScope lang={lang}>
							{t("settings.theme.description")}
						</LocalizedScope>
					</p>
				</div>
				<div className="my-4 h-px w-full bg-black/10 dark:bg-white/10" />
				<div className="px-4 pb-6 sm:px-8">
					<ThemeToggle
						value={theme}
						onChange={setTheme}
						options={options}
						ariaLabel={t("settings.theme.title")}
					/>
				</div>
			</div>
			<p className="text-xs text-muted-foreground">
				<LocalizedScope lang={lang}>
					{t("settings.theme.savedNote")}
				</LocalizedScope>
			</p>
		</div>
	);
};
