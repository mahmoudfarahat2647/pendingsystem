"use client";

import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type options = "Daily" | "Weekly" | "Monthly" | "Yearly";
const optionsList: options[] = ["Daily", "Weekly", "Monthly", "Yearly"];

const springTransition = {
	type: "spring",
	damping: 30,
	stiffness: 400,
	mass: 1,
} as const;

interface FrequencyPickerProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export default function FrequencyPicker({
	value,
	onChange,
	disabled,
}: FrequencyPickerProps) {
	// value format: "Frequency" or "Frequency-DayIndex"
	const [option, setOption] = useState<options>("Daily");
	const [day, setDay] = useState(1);
	const [isOptionOpen, setIsOptionOpen] = useState(false);
	const [isSelectorOpen, setIsSelectorOpen] = useState(false);

	// Sync local state with prop
	useEffect(() => {
		if (value.includes("-")) {
			const [freq, dayIdx] = value.split("-");
			setOption(freq as options);
			setDay(parseInt(dayIdx) || 0);
		} else {
			setOption(value as options);
			if (value === "Weekly") {
				// Default to Mon if just "Weekly"
				setDay(1);
			}
		}
	}, [value]);

	const handleConfirm = () => {
		let newValue = option as string;
		if (option === "Weekly") {
			newValue = `Weekly-${day}`;
		}
		onChange(newValue);
		setIsOptionOpen(false);
		setIsSelectorOpen(false);
	};

	if (disabled) {
		return (
			<div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed flex items-center justify-between">
				<span>
					{value.replace(/-(\d)/, (match, p1) => `, ${days[parseInt(p1)]}`)}
				</span>
				<HugeiconsIcon icon={UnfoldMoreIcon} size={14} className="-rotate-90" />
			</div>
		);
	}

	return (
		<div className="w-full h-full flex justify-center items-center font-medium text-sm">
			<motion.div
				layout
				transition={springTransition}
				className="flex flex-col gap-1.5 shadow-sm overflow-hidden rounded-3xl bg-muted p-1.5 max-w-xs w-full border border-border"
			>
				<div className="flex justify-between items-center relative h-9">
					<motion.div
						layout
						animate={{
							filter: isOptionOpen ? "blur(8px)" : "blur(0px)",
						}}
						transition={springTransition}
						className="px-3 text-muted-foreground h-full flex items-center justify-center py-2"
					>
						Frequency
					</motion.div>
					{isOptionOpen ? (
						<div className="absolute w-full h-full flex justify-between gap-2 p-0">
							<motion.div className="flex justify-between w-full relative items-center rounded-3xl">
								<motion.div
									layout
									transition={springTransition}
									layoutId="options"
									className="absolute w-full rounded-3xl bg-background h-full"
								></motion.div>

								<div className="flex justify-between px-1 w-full">
									{optionsList.map((op) => {
										return (
											<motion.div
												key={op}
												layout
												initial={{
													filter: "blur(8px)",
													opacity: 0,
												}}
												animate={{
													filter: "blur(0px)",
													opacity: 1,
												}}
												onClick={() => {
													setOption(op);
													setIsSelectorOpen(op === "Weekly");
												}}
												className={cn(
													"px-2 cursor-pointer py-1 rounded-[24px] text-muted-foreground relative transition-colors duration-300",
													option === op && "text-foreground",
												)}
											>
												{option === op && (
													<motion.div
														layoutId="optionToSelect"
														transition={springTransition}
														className="w-full h-full absolute inset-0 bg-secondary rounded-3xl"
													></motion.div>
												)}
												<span className="relative z-10">{op}</span>
											</motion.div>
										);
									})}
								</div>
							</motion.div>
							<AnimatePresence>
								<motion.div
									key="check-button"
									layoutId="button"
									onClick={handleConfirm}
									initial={{
										filter: "blur(1px)",
										opacity: 0.6,
									}}
									animate={{
										filter: "blur(0px)",
										opacity: 1,
									}}
									exit={{
										filter: "blur(1px)",
										opacity: 0.6,
									}}
									transition={springTransition}
									style={{ borderRadius: 24 }}
									className="bg-primary px-[10px] justify-center text-primary-foreground flex h-full items-center cursor-pointer"
								>
									<HugeiconsIcon icon={Tick02Icon} size={16} />
								</motion.div>
							</AnimatePresence>
						</div>
					) : (
						<motion.div
							onClick={() => setIsOptionOpen(true)}
							className="rounded-full w-fit px-0 p-0 relative flex gap-0 items-center cursor-pointer"
						>
							<motion.div
								layout
								transition={springTransition}
								layoutId="options"
								className="absolute h-full w-full bg-background rounded-[24px]"
							></motion.div>
							<motion.div
								initial={false}
								className="pl-3 py-0 relative cursor-default text-foreground truncate max-w-[120px]"
								layoutId={option}
							>
								{option === "Weekly" ? `${option}, ${days[day]}` : option}
							</motion.div>
							<AnimatePresence initial={false}>
								<motion.div
									key="code-icon"
									layoutId="button"
									className="text-muted-foreground justify-center flex items-center w-fit h-fit px-3 pl-2 py-[10px]"
								>
									<HugeiconsIcon
										icon={UnfoldMoreIcon}
										size={14}
										className="-rotate-90"
									/>
								</motion.div>
							</AnimatePresence>
						</motion.div>
					)}
				</div>
				<AnimatePresence mode="popLayout">
					{isSelectorOpen && option === "Weekly" && isOptionOpen && (
						<motion.div
							initial={{
								opacity: 0,
								y: -10,
								filter: "blur(8px)",
							}}
							animate={{
								opacity: 1,
								y: 0,
								filter: "blur(0px)",
							}}
							exit={{
								opacity: 0,
								y: -10,
								filter: "blur(8px)",
							}}
							transition={springTransition}
							className="flex justify-between text-muted-foreground px-2 bg-background overflow-hidden rounded-full py-1"
						>
							{days.map((d, index) => {
								return (
									<motion.div
										key={d}
										layout
										initial={{
											filter: "blur(8px)",
											opacity: 0,
										}}
										animate={{
											filter: "blur(0px)",
											opacity: 1,
										}}
										exit={{
											filter: "blur(8px)",
											opacity: 0,
										}}
										transition={{
											...springTransition,
											delay: index * 0.03,
										}}
										onClick={() => setDay(index)}
										className={cn(
											"px-2 py-1 rounded-3xl relative transition-colors duration-300 cursor-pointer",
											index === day
												? "text-foreground"
												: "text-muted-foreground",
										)}
									>
										<span className="relative z-10">{d}</span>
										{index === day && (
											<motion.div
												transition={springTransition}
												layoutId="dayOptions"
												className="absolute h-full w-full bg-secondary inset-0 rounded-3xl"
											></motion.div>
										)}
									</motion.div>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
