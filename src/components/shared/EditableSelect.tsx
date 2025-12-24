"use client";

import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditableSelectProps {
	options: string[];
	value: string;
	onChange: (value: string) => void;
	onAdd: (option: string) => void;
	onRemove: (option: string) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
}

export function EditableSelect({
	options,
	value,
	onChange,
	onAdd,
	onRemove,
	placeholder = "Select option...",
	emptyMessage = "No options found.",
	className,
}: EditableSelectProps) {
	const [open, setOpen] = React.useState(false);
	const [newItem, setNewItem] = React.useState("");

	const handleAdd = () => {
		if (newItem.trim()) {
			onAdd(newItem.trim());
			onChange(newItem.trim());
			setNewItem("");
			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between font-normal", className)}
				>
					{value ? value : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput
						placeholder={`Search ${placeholder.toLowerCase()}...`}
					/>
					<CommandList>
						<CommandEmpty>
							<div className="flex flex-col gap-2 p-2">
								<p className="text-xs text-muted-foreground">{emptyMessage}</p>
								<div className="flex gap-2">
									<Input
										placeholder="Add new..."
										value={newItem}
										onChange={(e) => setNewItem(e.target.value)}
										className="h-8 text-xs"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAdd();
											}
										}}
									/>
									<Button
										size="icon"
										variant="ghost"
										className="h-8 w-8"
										onClick={handleAdd}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option}
									value={option}
									onSelect={() => {
										onChange(option);
										setOpen(false);
									}}
									className="group flex items-center justify-between"
								>
									<div className="flex items-center">
										<Check
											className={cn(
												"mr-2 h-3 w-3",
												value === option ? "opacity-100" : "opacity-0",
											)}
										/>
										{option}
									</div>
									<Button
										size="icon"
										variant="ghost"
										className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => {
											e.stopPropagation();
											onRemove(option);
										}}
									>
										<X className="h-3 w-3" />
									</Button>
								</CommandItem>
							))}
						</CommandGroup>
						<div className="border-t p-2">
							<div className="flex gap-2">
								<Input
									placeholder="Add new..."
									value={newItem}
									onChange={(e) => setNewItem(e.target.value)}
									className="h-8 text-xs"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAdd();
										}
									}}
								/>
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8"
									onClick={handleAdd}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
