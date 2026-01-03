"use client";

import { Palette } from "lucide-react";

export const ThemeTab = () => {
	return (
		<div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in duration-500">
			<Palette className="h-12 w-12 text-gray-600 mb-4" />
			<h3 className="text-gray-400 font-medium">Appearance Settings</h3>
			<p className="text-sm text-gray-600 mt-2">
				Custom themes and color presets are coming soon.
			</p>
		</div>
	);
};
