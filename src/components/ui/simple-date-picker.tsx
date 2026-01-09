"use client";

import { format, isValid, parse } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SimpleDatePickerProps {
    value?: string; // ISO date string (YYYY-MM-DD)
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * A simple date picker that allows:
 * - Typing/pasting dates in various formats
 * - Selecting from a calendar popup
 * - Clear button to reset
 */
export function SimpleDatePicker({
    value,
    onChange,
    placeholder = "YYYY-MM-DD",
    className,
    disabled = false,
}: SimpleDatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || "");

    // Sync input value when prop changes
    React.useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    // Parse input and try multiple date formats
    const parseUserInput = (input: string): Date | null => {
        if (!input.trim()) return null;

        const formats = [
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "MM/dd/yyyy",
            "dd-MM-yyyy",
            "MM-dd-yyyy",
            "d/M/yyyy",
            "M/d/yyyy",
            "yyyy/MM/dd",
        ];

        for (const fmt of formats) {
            const parsed = parse(input.trim(), fmt, new Date());
            if (isValid(parsed)) {
                return parsed;
            }
        }

        // Try native parsing as fallback
        const nativeParsed = new Date(input.trim());
        if (isValid(nativeParsed)) {
            return nativeParsed;
        }

        return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
    };

    const handleInputBlur = () => {
        const parsed = parseUserInput(inputValue);
        if (parsed) {
            const isoDate = format(parsed, "yyyy-MM-dd");
            setInputValue(isoDate);
            onChange?.(isoDate);
        } else if (!inputValue.trim()) {
            onChange?.("");
        }
    };

    const handleCalendarSelect = (date: Date | undefined) => {
        if (date) {
            const isoDate = format(date, "yyyy-MM-dd");
            setInputValue(isoDate);
            onChange?.(isoDate);
        }
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue("");
        onChange?.("");
    };

    // Convert current value to Date for calendar
    const selectedDate = value ? parseUserInput(value) : undefined;

    return (
        <div className={cn("relative flex items-center", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <div className="relative flex-1">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            "bg-[#161618] border-white/5 h-9 text-xs rounded-lg pl-3 pr-16 transition-all",
                            "focus:ring-1 focus:ring-indigo-500/30",
                        )}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleInputBlur();
                            }
                        }}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {inputValue && !disabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                className="h-6 w-6 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            >
                                <CalendarIcon className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                    </div>
                </div>
                <PopoverContent
                    className="w-auto p-0 border-white/10 bg-[#0c0c0e]"
                    align="start"
                >
                    <Calendar
                        mode="single"
                        selected={selectedDate ?? undefined}
                        onSelect={handleCalendarSelect}
                        initialFocus
                        captionLayout="dropdown"
                        startMonth={new Date(2015, 0)}
                        endMonth={new Date(2040, 11)}
                        className="bg-[#0c0c0e] text-slate-200 [color-scheme:dark]"
                        classNames={{
                            months:
                                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption:
                                "flex justify-center pt-1 relative items-center text-slate-200 gap-1",
                            caption_label: "text-sm font-medium hidden",
                            caption_dropdowns:
                                "flex justify-center gap-1 [&_select]:bg-[#0c0c0e] [&_select]:text-slate-200 [&_select]:border [&_select]:border-white/10 [&_select]:rounded-md [&_select]:p-1 [&_select]:px-2 [&_select]:cursor-pointer [&_select]:outline-none [&_select]:text-sm [&_select]:appearance-none [&_select]:hover:bg-white/5 [&_select]:transition-colors [&_option]:bg-[#0c0c0e] [&_option]:text-white",
                            nav: "space-x-1 flex items-center",
                            nav_button:
                                "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 border border-white/10 rounded-md hover:bg-white/5",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell:
                                "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-indigo-500/20 text-slate-300 transition-colors",
                            day_range_end: "day-range-end",
                            day_selected:
                                "bg-indigo-600 text-white hover:bg-indigo-500 focus:bg-indigo-600",
                            day_today: "bg-white/10 text-slate-100",
                            day_outside: "text-slate-600 opacity-50",
                            day_disabled: "text-slate-600 opacity-30",
                            day_hidden: "invisible",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
