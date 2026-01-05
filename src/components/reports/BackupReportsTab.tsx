"use client";

import { SchedulingCard } from "./SchedulingCard";
import { RecipientsCard } from "./RecipientsCard";
import { ManualActionCard } from "./ManualActionCard";

interface BackupReportsTabProps {
    isLocked: boolean;
}

export default function BackupReportsTab({ isLocked }: BackupReportsTabProps) {
    return (
        <div className="w-full space-y-6 fade-in animate-in">
            <div className="grid gap-6 md:grid-cols-2">
                <SchedulingCard isLocked={isLocked} />
                <RecipientsCard isLocked={isLocked} />
            </div>
            <ManualActionCard isLocked={isLocked} />
        </div>
    );
}
