"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface WarrantyDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
}

export function WarrantyDatePicker({ value, onChange, id }: WarrantyDatePickerProps) {
    // Convert string value (yyyy-MM-dd) to Date object
    const date = React.useMemo(() => {
        if (!value) return undefined;
        const parsed = parse(value, "yyyy-MM-dd", new Date());
        return isNaN(parsed.getTime()) ? undefined : parsed;
    }, [value]);

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            onChange(format(selectedDate, "yyyy-MM-dd"));
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-[#1a1a1c] border-white/[0.08] text-white h-10 rounded-lg hover:bg-white/5 hover:text-white focus:ring-0",
                        !date && "text-gray-500"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {date ? format(date, "PPP") : <span className="text-gray-500">Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#0c0c0e] border-white/[0.08]" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                    className="bg-[#0c0c0e] text-white"
                />
            </PopoverContent>
        </Popover>
    )
}
