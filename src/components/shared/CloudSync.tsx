"use client";

import { CheckCircle, CloudUpload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSaveOrderMutation } from "@/hooks/queries/useOrdersQuery";
import type { OrderStage } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";

export function CloudSync() {
	const [isSyncing, setIsSyncing] = useState(false);
	const [completed, setCompleted] = useState(false);

	const store = useAppStore();
	const saveMutation = useSaveOrderMutation();

	const syncData = async () => {
		setIsSyncing(true);
		try {
			const migrations = [
				{ data: store.ordersRowData, stage: "orders" as OrderStage },
				{ data: store.rowData, stage: "main" as OrderStage },
				{ data: store.callRowData, stage: "call" as OrderStage },
				{ data: store.bookingRowData, stage: "booking" as OrderStage },
				{ data: store.archiveRowData, stage: "archive" as OrderStage },
			];

			let total = 0;
			for (const mig of migrations) {
				for (const row of mig.data) {
					await saveMutation.mutateAsync({
						id: row.id,
						updates: row,
						stage: mig.stage,
					});
					total++;
				}
			}

			toast.success(`Successfully migrated ${total} rows to Supabase!`);
			setCompleted(true);
		} catch (error: any) {
			toast.error(`Migration failed: ${error.message}`);
		} finally {
			setIsSyncing(false);
		}
	};

	if (completed) {
		return (
			<Button variant="outline" disabled className="gap-2 text-green-500">
				<CheckCircle className="h-4 w-4" />
				Synced to Cloud
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			onClick={syncData}
			disabled={isSyncing}
			className="gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20"
		>
			{isSyncing ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<CloudUpload className="h-4 w-4" />
			)}
			{isSyncing ? "Syncing..." : "Sync Local Data to Cloud"}
		</Button>
	);
}
