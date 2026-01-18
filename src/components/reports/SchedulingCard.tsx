"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/useStore";
import FrequencyPicker from "./FrequencyPicker";

interface SchedulingCardProps {
    isLocked: boolean;
}

export function SchedulingCard({ isLocked }: SchedulingCardProps) {
    const { reportSettings, updateReportSettings, fetchReportSettings } = useAppStore();

    useEffect(() => {
        if (!reportSettings) {
            fetchReportSettings();
        }
    }, [reportSettings, fetchReportSettings]);

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
                            updateReportSettings({ is_enabled: checked })
                        }
                        disabled={isLoading || isLocked}
                    />
                </div>

                <FrequencyPicker
                    value={reportSettings?.frequency || "Weekly"}
                    onChange={(value) =>
                        updateReportSettings({ frequency: value })
                    }
                    disabled={isLoading || !reportSettings?.is_enabled || isLocked}
                />
            </CardContent>
        </Card>
    );
}
