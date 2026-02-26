"use client";

import { format } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
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
} from "@/hooks/queries/useReportSettingsQuery";

interface ManualActionCardProps {
	isLocked: boolean;
}

export function ManualActionCard({ isLocked }: ManualActionCardProps) {
	const { data: reportSettings } = useReportSettingsQuery();
	const triggerManualBackupMutation = useTriggerManualBackupMutation();

	const handleTriggerBackup = async () => {
		try {
			await triggerManualBackupMutation.mutateAsync();
			toast.success("Backup process started successfully");
		} catch {
			toast.error("Failed to start backup");
		}
	};

	const isLoading = !reportSettings;

	return (
		<Card className="border-destructive/20 bg-destructive/5">
			<CardHeader>
				<CardTitle className="text-destructive">Manual Action</CardTitle>
				<CardDescription>
					Immediately generate and send a backup report to all recipients.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm text-muted-foreground">
						{reportSettings?.last_sent_at ? (
							<p>
								Last sent:{" "}
								{format(new Date(reportSettings.last_sent_at), "PPp")}
							</p>
						) : (
							<p>No reports sent yet.</p>
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
								Sending...
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								Send Backup Now
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
