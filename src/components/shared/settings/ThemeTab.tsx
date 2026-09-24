"use client";

import { Palette } from "lucide-react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { useT } from "@/hooks/useT";

export const ThemeTab = () => {
	const { t, lang } = useT();

	return (
		<div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in duration-500">
			<Palette className="h-12 w-12 text-gray-600 mb-4" />
			<h3 className="text-gray-400 font-medium">
				<LocalizedScope lang={lang}>{t("settings.theme.title")}</LocalizedScope>
			</h3>
			<p className="text-sm text-gray-600 mt-2">
				<LocalizedScope lang={lang}>
					{t("settings.theme.comingSoon")}
				</LocalizedScope>
			</p>
		</div>
	);
};
