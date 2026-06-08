"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useStore";

interface PermissionTabProps {
	isLocked: boolean;
}

export const PermissionTab = ({ isLocked }: PermissionTabProps) => {
	const gridEditPermission = useAppStore((s) => s.gridEditPermission);
	const setGridEditPermission = useAppStore((s) => s.setGridEditPermission);

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
				<div className="space-y-1">
					<Label className="text-sm font-semibold text-white">
						Allow Grid Editing
					</Label>
					<p className="text-xs text-gray-400">
						When enabled, cells on Main Sheet, Call List, Booking, and Archive
						can be edited directly. Changes require clicking Save to persist.
						Orders stage is unaffected.
					</p>
				</div>
				<Switch
					checked={gridEditPermission}
					onCheckedChange={setGridEditPermission}
					disabled={isLocked}
					aria-label="Allow grid editing"
				/>
			</div>

			{isLocked && (
				<p className="text-xs text-gray-600 text-center">
					Unlock settings to change this permission.
				</p>
			)}
		</div>
	);
};
