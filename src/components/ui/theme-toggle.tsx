"use client";

import { motion } from "motion/react";
import { type ComponentType, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

export interface ThemeToggleOption<T extends string> {
	value: T;
	label: ReactNode;
	preview: ComponentType;
	/** Card background behind the preview. */
	surfaceClassName?: string;
}

interface ThemeToggleProps<T extends string> {
	value: T;
	onChange: (value: T) => void;
	options: ThemeToggleOption<T>[];
	/** Accessible name for the radio group. */
	ariaLabel: string;
	className?: string;
}

/**
 * Card-style theme picker: each option shows a miniature app preview with a
 * label pill; the selected card gets a yellow ring and a sliding underline.
 * Native radio inputs keep it keyboard- and screen-reader-accessible.
 */
export function ThemeToggle<T extends string>({
	value,
	onChange,
	options,
	ariaLabel,
	className,
}: ThemeToggleProps<T>) {
	const name = useId();

	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			className={cn("grid gap-4 sm:grid-cols-2", className)}
		>
			{options.map((option) => {
				const Preview = option.preview;
				const isSelected = option.value === value;
				const inputId = `${name}-${option.value}`;

				return (
					<label
						key={option.value}
						htmlFor={inputId}
						className={cn(
							"group relative flex cursor-pointer items-end justify-center rounded-xl border px-2 pt-4 pb-0 transition",
							"has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-renault-yellow/70",
							isSelected
								? "border-renault-yellow ring-2 ring-renault-yellow/40"
								: "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25",
							option.surfaceClassName,
						)}
					>
						<input
							type="radio"
							id={inputId}
							name={name}
							value={option.value}
							checked={isSelected}
							onChange={() => onChange(option.value)}
							className="sr-only"
						/>
						<span className="block w-full max-w-[177px] overflow-hidden">
							<span className="block overflow-hidden rounded-t-md border border-b-0 border-black/10 dark:border-white/10 shadow-xl shadow-black/20">
								<Preview />
							</span>
						</span>
						<span className="absolute inset-x-0 bottom-3 flex justify-center">
							<span className="relative">
								<span
									className={cn(
										"inline-flex h-[30px] select-none items-center justify-center rounded-md border px-3 text-[13px] font-semibold leading-none shadow-sm transition-colors",
										"bg-white text-black border-black/10 dark:bg-[#1c1c1e] dark:text-white dark:border-white/10",
									)}
								>
									{option.label}
								</span>
								{isSelected && (
									<motion.span
										layoutId={`${name}-active`}
										className="absolute inset-x-1.5 -bottom-2 h-0.5 rounded-full bg-renault-yellow"
									/>
								)}
							</span>
						</span>
					</label>
				);
			})}
		</div>
	);
}
