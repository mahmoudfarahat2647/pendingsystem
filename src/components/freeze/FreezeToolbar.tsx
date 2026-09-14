"use client";

import { Download, Filter, MoveRight } from "lucide-react";
import { LayoutSaveButton } from "@/components/shared/LayoutSaveButton";
import { SelectAllByVinButton } from "@/components/shared/SelectAllByVinButton";
import { VINLineCounter } from "@/components/shared/VINLineCounter";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useColumnLayoutTracker } from "@/hooks/useColumnLayoutTracker";
import type { PendingRow } from "@/types";

export interface FreezeToolbarProps {
	selectedRows?: PendingRow[];
	rowData?: PendingRow[];
	onExtract: () => void;
	onFilterToggle: () => void;
	onSelectAllByVin: () => void;
	isSelectAllByVinDisabled: boolean;
	/** Opens the "Move to…" unfreeze picker for the current selection. */
	onMoveTo?: () => void;
}

export function FreezeToolbar({
	selectedRows = [],
	rowData = [],
	onExtract,
	onFilterToggle,
	onSelectAllByVin,
	isSelectAllByVinDisabled,
	onMoveTo,
}: FreezeToolbarProps) {
	const { isDirty, isPositionDirty, saveLayout, saveAsDefault, resetLayout } =
		useColumnLayoutTracker("freeze");

	return (
		<div className="flex items-center justify-between bg-[#141416] p-1.5 rounded-lg border border-white/5">
			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-gray-300 border-none rounded-md h-8 w-8"
							onClick={onExtract}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Extract</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-gray-400 hover:text-white h-8 w-8"
							onClick={onFilterToggle}
						>
							<Filter className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Filter</TooltipContent>
				</Tooltip>

				<LayoutSaveButton
					isDirty={isDirty}
					isPositionDirty={isPositionDirty}
					onSave={saveLayout}
					onSaveAsDefault={saveAsDefault}
					onReset={resetLayout}
				/>

				<div className="w-px h-5 bg-white/10 mx-1" />

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="text-sky-400/80 hover:text-sky-400 h-8 w-8"
							onClick={onMoveTo}
							disabled={selectedRows.length === 0 || !onMoveTo}
						>
							<MoveRight className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Move to… (unfreeze)</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex items-center gap-1.5">
				<SelectAllByVinButton
					onSelectAllByVin={onSelectAllByVin}
					isDisabled={isSelectAllByVinDisabled}
				/>
				<VINLineCounter rows={rowData} />
			</div>
		</div>
	);
}
