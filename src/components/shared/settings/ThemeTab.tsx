"use client";

import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: {
	value: Theme;
	labelKey: "settings.theme.dark" | "settings.theme.white";
}[] = [
	{ value: "dark", labelKey: "settings.theme.dark" },
	{ value: "white", labelKey: "settings.theme.white" },
];

export const ThemeTab = () => {
	const { t, lang } = useT();
	const { theme, setTheme } = useTheme();

	return (
		<div className="flex flex-col gap-4 animate-in fade-in duration-500">
			<div>
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
			<fieldset className="flex gap-3 border-0 p-0 m-0">
				{OPTIONS.map(({ value, labelKey }) => (
					<button
						key={value}
						type="button"
						aria-pressed={theme === value}
						onClick={() => setTheme(value)}
						className={cn(
							"rounded-lg border px-6 py-3 text-sm font-medium transition-colors",
							theme === value
								? "border-yellow-400 ring-1 ring-yellow-400"
								: "border-border hover:border-yellow-400/60",
						)}
					>
						<LocalizedScope lang={lang}>{t(labelKey)}</LocalizedScope>
					</button>
				))}
			</fieldset>
			<p className="text-xs text-muted-foreground">
				<LocalizedScope lang={lang}>
					{t("settings.theme.savedNote")}
				</LocalizedScope>
			</p>
		</div>
	);
};
