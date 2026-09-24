"use client";

import { format } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	useReportSettingsQuery,
	useTriggerManualBackupMutation,
} from "@/hooks/queries/reports/useReportSettingsQuery";
import { useT } from "@/hooks/useT";

interface ManualActionCardProps {
	isLocked: boolean;
}

export function ManualActionCard({ isLocked }: ManualActionCardProps) {
	const { data: reportSettings } = useReportSettingsQuery();
	const triggerManualBackupMutation = useTriggerManualBackupMutation();
	const { t, lang } = useT();

	const handleTriggerBackup = async () => {
		try {
			await triggerManualBackupMutation.mutateAsync();
			toast.success("Backup process started successfully");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to start backup";
			toast.error(message);
		}
	};

	const isLoading = !reportSettings;

	return (
		<Card className="border-destructive/20 bg-destructive/5">
			<CardHeader>
				<CardTitle className="text-destructive">
					<LocalizedScope lang={lang}>
						{t("settings.reports.manualActionTitle")}
					</LocalizedScope>
				</CardTitle>
				<CardDescription>
					<LocalizedScope lang={lang}>
						{t("settings.reports.manualActionDescription")}
					</LocalizedScope>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm text-muted-foreground">
						{reportSettings?.last_sent_at ? (
							<p>
								<LocalizedScope lang={lang}>
									{t("settings.reports.lastSent", {
										date: format(new Date(reportSettings.last_sent_at), "PPp"),
									})}
								</LocalizedScope>
							</p>
						) : (
							<p>
								<LocalizedScope lang={lang}>
									{t("settings.reports.noReportsSent")}
								</LocalizedScope>
							</p>
						)}
					</div>
					<Button
						type="button"
						variant="destructive"
						onClick={handleTriggerBackup}
						disabled={
							triggerManualBackupMutation.isPending || isLoading || isLocked
						}
					>
						{triggerManualBackupMutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<LocalizedScope lang={lang}>
									{t("settings.reports.sending")}
								</LocalizedScope>
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								<LocalizedScope lang={lang}>
									{t("settings.reports.sendBackupNow")}
								</LocalizedScope>
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
