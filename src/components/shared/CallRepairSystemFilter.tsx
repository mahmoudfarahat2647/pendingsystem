"use client";

import { Filter } from "lucide-react";
import { useMemo } from "react";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxValue,
} from "@/components/ui/combobox";
import type { RepairSystemFilterOption } from "@/lib/callRepairSystemFilter";
import { cn } from "@/lib/utils";

interface CallRepairSystemFilterProps {
	options: RepairSystemFilterOption[];
	value: string[];
	onChange: (value: string[]) => void;
	className?: string;
}

/**
 * Multi-select filter UI for repair systems in the Call List toolbar.
 * Renders as a compact chip-based combobox; options are derived from live row data.
 */
export const CallRepairSystemFilter = ({
	options,
	value,
	onChange,
	className,
}: CallRepairSystemFilterProps) => {
	const selectedOptions = useMemo(
		() => options.filter((option) => value.includes(option.value)),
		[options, value],
	);

	return (
		<div className={cn("w-auto", className)}>
			<Combobox<RepairSystemFilterOption, true>
				items={options}
				isItemEqualToValue={(item, selected) => item.value === selected.value}
				multiple
				onValueChange={(nextValue) => {
					onChange(nextValue.map((option) => option.value));
				}}
				value={selectedOptions}
			>
				<ComboboxChips
					className="min-h-8 rounded-md border-white/10 bg-[#1c1c1e] p-1 text-white shadow-none ring-0 focus-within:border-white/20 focus-within:ring-0 dark:not-has-disabled:bg-[#1c1c1e]"
					startAddon={<Filter className="h-3.5 w-3.5 text-gray-400" />}
				>
					<ComboboxValue>
						{(selectedValue: RepairSystemFilterOption[]) => (
							<>
								{selectedValue?.map((option) => (
									<ComboboxChip
										aria-label={option.label}
										className="min-h-5 rounded bg-white/10 ps-1.5 text-[10px] text-white/90"
										key={option.value}
									>
										{option.label}
									</ComboboxChip>
								))}
								<ComboboxChipsInput
									aria-label="Filter repair system"
									className="min-w-12 bg-transparent py-0 text-xs text-gray-300 outline-none placeholder:text-gray-500"
									disabled={options.length === 0}
									placeholder={
										selectedValue.length > 0 ? undefined : "Repair system"
									}
									size="sm"
								/>
							</>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxPopup className="border-white/10 bg-[#1c1c1e] shadow-xl/20">
					<ComboboxEmpty>No repair systems found.</ComboboxEmpty>
					<ComboboxList>
						{(option: RepairSystemFilterOption) => (
							<ComboboxItem
								className="text-white data-highlighted:bg-white/10 data-highlighted:text-white"
								key={option.value}
								value={option}
							>
								{option.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxPopup>
			</Combobox>
		</div>
	);
};
