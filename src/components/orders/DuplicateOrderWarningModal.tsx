import { AlertCircle } from "lucide-react";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { getStageDisplayName } from "@/domain/order/orderWorkflow";
import { useT } from "@/hooks/useT";

interface DuplicateOrderWarningModalProps {
	open: boolean;
	onClose: () => void;
	location: string;
	vin: string;
	partNumber: string;
}

export function DuplicateOrderWarningModal({
	open,
	onClose,
	location,
	vin,
	partNumber,
}: DuplicateOrderWarningModalProps) {
	const { t, lang } = useT();
	const stageName = getStageDisplayName(location);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				closeLabel={t("common.close")}
				className="max-w-md bg-white dark:bg-[#0c0c0e] border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-200"
			>
				<div className="flex flex-col items-center text-center space-y-4 pt-6">
					<div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
						<AlertCircle className="h-6 w-6 text-red-500" />
					</div>

					<div className="space-y-2">
						<DialogTitle className="text-xl font-semibold text-black dark:text-white">
							<LocalizedScope lang={lang}>
								{t("modals.duplicate.title")}
							</LocalizedScope>
						</DialogTitle>
						<DialogDescription className="text-slate-600 dark:text-slate-400">
							<LocalizedScope lang={lang}>
								{t("modals.duplicate.descriptionBeforeVin")}{" "}
								<span className="text-black dark:text-white font-mono">
									{vin}
								</span>{" "}
								{t("modals.duplicate.descriptionBeforePart")}{" "}
								<span className="text-black dark:text-white font-mono">
									{partNumber}
								</span>{" "}
								{t("modals.duplicate.descriptionAfter")}
							</LocalizedScope>
						</DialogDescription>
					</div>

					<div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-4 w-full text-sm">
						<LocalizedScope lang={lang}>
							{t("modals.duplicate.locatedIn")}
						</LocalizedScope>
						<div className="mt-2 text-lg font-semibold text-black dark:text-white">
							{stageName}
						</div>
					</div>
				</div>

				<DialogFooter className="mt-6 sm:justify-center">
					<Button
						onClick={onClose}
						className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white"
					>
						<LocalizedScope lang={lang}>
							{t("common.understood")}
						</LocalizedScope>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
