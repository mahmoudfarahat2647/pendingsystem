"use client";

import { ManualActionCard } from "./ManualActionCard";
import { RecipientsCard } from "./RecipientsCard";
import { SchedulingCard } from "./SchedulingCard";

interface BackupReportsTabProps {
	isLocked: boolean;
}

export default function BackupReportsTab({
	isLocked,
}: Readonly<BackupReportsTabProps>) {
	return (
		<div className="w-full space-y-6 fade-in animate-in">
			<div className="grid gap-6 md:grid-cols-[58%_42%]">
				<SchedulingCard isLocked={isLocked} />
				<RecipientsCard isLocked={isLocked} />
			</div>
			<ManualActionCard isLocked={isLocked} />
		</div>
	);
}
