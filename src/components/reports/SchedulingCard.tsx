"use client";

import { LocalizedScope } from "@/components/shared/LocalizedScope";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	useReportSettingsQuery,
	useUpdateReportSettingsMutation,
} from "@/hooks/queries/reports/useReportSettingsQuery";
import { useT } from "@/hooks/useT";
import FrequencyPicker from "./FrequencyPicker";

interface SchedulingCardProps {
	isLocked: boolean;
}

export function SchedulingCard({ isLocked }: SchedulingCardProps) {
	const { data: reportSettings } = useReportSettingsQuery();
	const updateReportSettingsMutation = useUpdateReportSettingsMutation();

	const { t, lang } = useT();

	const isLoading = !reportSettings;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<LocalizedScope lang={lang}>
						{t("settings.reports.schedulingTitle")}
					</LocalizedScope>
				</CardTitle>
				<CardDescription>
					<LocalizedScope lang={lang}>
						{t("settings.reports.schedulingDescription")}
					</LocalizedScope>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-between space-x-2">
					<Label htmlFor="auto-backup" className="flex flex-col space-y-1">
						<span>
							<LocalizedScope lang={lang}>
								{t("settings.reports.automaticBackups")}
							</LocalizedScope>
						</span>
						<span className="font-normal text-xs text-muted-foreground">
							<LocalizedScope lang={lang}>
								{t("settings.reports.automaticBackupsHint")}
							</LocalizedScope>
						</span>
					</Label>
					<Switch
						id="auto-backup"
						checked={reportSettings?.is_enabled ?? false}
						onCheckedChange={(checked) =>
							updateReportSettingsMutation.mutate({ is_enabled: checked })
						}
						disabled={isLoading || isLocked}
					/>
				</div>

				<div className="space-y-4" data-testid="frequency-picker-container">
					<Label className="text-sm font-medium">
						<LocalizedScope lang={lang}>
							{t("settings.reports.frequency")}
						</LocalizedScope>
					</Label>
					<FrequencyPicker
						value={reportSettings?.frequency || "Weekly"}
						onChange={(value) =>
							updateReportSettingsMutation.mutate({ frequency: value })
						}
						disabled={isLoading || !reportSettings?.is_enabled || isLocked}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
