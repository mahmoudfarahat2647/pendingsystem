"use client";

import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/hooks/useT";
import { useAppStore } from "@/store/useStore";

interface PermissionTabProps {
	isLocked: boolean;
}

export const PermissionTab = ({ isLocked }: PermissionTabProps) => {
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);
	const setGridEditPermission = useAppStore((s) => s.setGridEditPermission);
	const { t, lang } = useT();

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
				<div className="space-y-1">
					<Label className="text-sm font-semibold text-white">
						<LocalizedScope lang={lang}>
							{t("settings.permission.allowGridEditing")}
						</LocalizedScope>
					</Label>
					<p className="text-xs text-gray-400">
						<LocalizedScope lang={lang}>
							{t("settings.permission.description")}
						</LocalizedScope>
					</p>
				</div>
				<Switch
					checked={gridEditPermission}
					onCheckedChange={setGridEditPermission}
					disabled={isLocked}
					aria-label={t("settings.permission.allowGridEditingAria")}
				/>
			</div>

			{isLocked && (
				<p className="text-xs text-gray-600 text-center">
					<LocalizedScope lang={lang}>
						{t("settings.permission.unlockHint")}
					</LocalizedScope>
				</p>
			)}
		</div>
	);
};
