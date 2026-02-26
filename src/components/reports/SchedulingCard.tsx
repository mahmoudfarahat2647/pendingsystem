"use client";

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
} from "@/hooks/queries/useReportSettingsQuery";
import FrequencyPicker from "./FrequencyPicker";

interface SchedulingCardProps {
	isLocked: boolean;
}

export function SchedulingCard({ isLocked }: SchedulingCardProps) {
	const { data: reportSettings } = useReportSettingsQuery();
	const updateReportSettingsMutation = useUpdateReportSettingsMutation();

	const isLoading = !reportSettings;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Scheduling</CardTitle>
				<CardDescription>
					Configure how often you want to receive automated backups.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-between space-x-2">
					<Label htmlFor="auto-backup" className="flex flex-col space-y-1">
						<span>Automatic Backups</span>
						<span className="font-normal text-xs text-muted-foreground">
							Enable scheduled reports sent to your email.
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
					<Label className="text-sm font-medium">Frequency</Label>
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
