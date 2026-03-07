import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { getStageDisplayName } from "@/lib/orderWorkflow";

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
	const stageName = getStageDisplayName(location);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-md bg-[#0c0c0e] border-white/10 text-slate-200">
				<div className="flex flex-col items-center text-center space-y-4 pt-6">
					<div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
						<AlertCircle className="h-6 w-6 text-red-500" />
					</div>

					<div className="space-y-2">
						<DialogTitle className="text-xl font-semibold text-white">
							Duplicate Order Detected
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							An order with the same VIN{" "}
							<span className="text-white font-mono">{vin}</span> and Part
							Number <span className="text-white font-mono">{partNumber}</span>{" "}
							already exists.
						</DialogDescription>
					</div>

					<div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full text-sm">
						This order is currently located in:
						<div className="mt-2 text-lg font-semibold text-white">
							{stageName}
						</div>
					</div>
				</div>

				<DialogFooter className="mt-6 sm:justify-center">
					<Button
						onClick={onClose}
						className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white"
					>
						Understood
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
