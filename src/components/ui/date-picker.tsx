"use client";

import { DatePicker } from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { parseDate } from "@internationalized/date";

// ... existing imports

interface DatePickerProps {
	value?: string | string[];
	onChange?: (details: { value: string[] }) => void;
	placeholder?: string;
	label?: string;
	className?: string;
}

export const BasicDatePicker = ({
	value,
	onChange,
	placeholder = "Pick a date",
	label,
	className,
}: DatePickerProps) => {
	return (
		<div className={cn("w-full", className)}>
			<DatePicker.Root
				value={
					value
						? (Array.isArray(value) ? value : [value]).map((d) => parseDate(d))
						: undefined
				}
				onValueChange={(details) =>
					onChange?.({ value: details.value.map((d) => d.toString()) })
				}
			>
				{label && (
					<DatePicker.Label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase ml-1">
						{label}
					</DatePicker.Label>
				)}

				{/* Input + Controls */}
				<DatePicker.Control className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#161618] px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
					<DatePicker.Input
						className="flex-1 bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-600"
						placeholder={placeholder}
					/>
					<DatePicker.Trigger className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 transition-colors">
						<Calendar size={14} />
					</DatePicker.Trigger>
					<DatePicker.ClearTrigger className="p-1.5 rounded-md text-red-400 hover:bg-red-400/10 transition-colors">
						<X size={14} />
					</DatePicker.ClearTrigger>
				</DatePicker.Control>

				{/* Calendar Popup */}
				<Portal>
					<DatePicker.Positioner className="z-[9999]">
						<DatePicker.Content className="mt-2 w-[280px] rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl p-3 backdrop-blur-xl">
							{/* Year + Month Select */}
							<div className="flex gap-2 mb-3">
								<DatePicker.MonthSelect className="flex-1 rounded-md border border-white/5 bg-[#161618] px-2 py-1 text-[11px] text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/30" />
								<DatePicker.YearSelect className="flex-1 rounded-md border border-white/5 bg-[#161618] px-2 py-1 text-[11px] text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/30" />
							</div>

							{/* Day View */}
							<DatePicker.View view="day">
								<DatePicker.Context>
									{(datePicker) => (
										<>
											<DatePicker.ViewControl className="flex justify-between items-center mb-2 text-xs font-medium text-slate-400">
												<DatePicker.PrevTrigger className="p-1 rounded-md hover:bg-white/5 transition-colors">
													<ChevronLeft size={16} />
												</DatePicker.PrevTrigger>
												<DatePicker.ViewTrigger className="cursor-pointer px-2 py-1 rounded-md hover:bg-white/5 transition-colors font-bold text-slate-200">
													<DatePicker.RangeText />
												</DatePicker.ViewTrigger>
												<DatePicker.NextTrigger className="p-1 rounded-md hover:bg-white/5 transition-colors">
													<ChevronRight size={16} />
												</DatePicker.NextTrigger>
											</DatePicker.ViewControl>

											<DatePicker.Table className="w-full text-center text-[11px]">
												<DatePicker.TableHead>
													<DatePicker.TableRow>
														{datePicker.weekDays.map((weekDay, id) => (
															<DatePicker.TableHeader
																key={id}
																className="py-2 text-slate-500 font-bold uppercase text-[9px]"
															>
																{weekDay.short}
															</DatePicker.TableHeader>
														))}
													</DatePicker.TableRow>
												</DatePicker.TableHead>
												<DatePicker.TableBody>
													{datePicker.weeks.map((week, id) => (
														<DatePicker.TableRow key={id}>
															{week.map((day, id) => (
																<DatePicker.TableCell key={id} value={day}>
																	<DatePicker.TableCellTrigger className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-500/20 text-slate-300 transition-colors cursor-pointer aria-selected:bg-indigo-600 aria-selected:text-white">
																		{day.day}
																	</DatePicker.TableCellTrigger>
																</DatePicker.TableCell>
															))}
														</DatePicker.TableRow>
													))}
												</DatePicker.TableBody>
											</DatePicker.Table>
										</>
									)}
								</DatePicker.Context>
							</DatePicker.View>

							{/* Month View */}
							<DatePicker.View view="month">
								<DatePicker.Context>
									{(datePicker) => (
										<>
											<DatePicker.ViewControl className="flex justify-between items-center mb-2">
												<DatePicker.PrevTrigger className="p-1 rounded-md hover:bg-white/5">
													<ChevronLeft size={16} />
												</DatePicker.PrevTrigger>
												<DatePicker.ViewTrigger className="cursor-pointer px-2 py-1 rounded-md hover:bg-white/5 text-xs font-bold text-slate-200">
													<DatePicker.RangeText />
												</DatePicker.ViewTrigger>
												<DatePicker.NextTrigger className="p-1 rounded-md hover:bg-white/5">
													<ChevronRight size={16} />
												</DatePicker.NextTrigger>
											</DatePicker.ViewControl>
											<DatePicker.Table className="w-full text-[11px]">
												<DatePicker.TableBody>
													{datePicker
														.getMonthsGrid({ columns: 3, format: "short" })
														.map((months, id) => (
															<DatePicker.TableRow key={id}>
																{months.map((month, id) => (
																	<DatePicker.TableCell
																		key={id}
																		value={month.value}
																	>
																		<DatePicker.TableCellTrigger className="w-full py-2 rounded-lg hover:bg-indigo-500/20 text-slate-300 transition-colors cursor-pointer aria-selected:bg-indigo-600 aria-selected:text-white">
																			{month.label}
																		</DatePicker.TableCellTrigger>
																	</DatePicker.TableCell>
																))}
															</DatePicker.TableRow>
														))}
												</DatePicker.TableBody>
											</DatePicker.Table>
										</>
									)}
								</DatePicker.Context>
							</DatePicker.View>

							{/* Year View */}
							<DatePicker.View view="year">
								<DatePicker.Context>
									{(datePicker) => (
										<>
											<DatePicker.ViewControl className="flex justify-between items-center mb-2">
												<DatePicker.PrevTrigger className="p-1 rounded-md hover:bg-white/5">
													<ChevronLeft size={16} />
												</DatePicker.PrevTrigger>
												<DatePicker.ViewTrigger className="cursor-pointer px-2 py-1 rounded-md hover:bg-white/5 text-xs font-bold text-slate-200">
													<DatePicker.RangeText />
												</DatePicker.ViewTrigger>
												<DatePicker.NextTrigger className="p-1 rounded-md hover:bg-white/5">
													<ChevronRight size={16} />
												</DatePicker.NextTrigger>
											</DatePicker.ViewControl>
											<DatePicker.Table className="w-full text-[11px]">
												<DatePicker.TableBody>
													{datePicker
														.getYearsGrid({ columns: 3 })
														.map((years, id) => (
															<DatePicker.TableRow key={id}>
																{years.map((year, id) => (
																	<DatePicker.TableCell
																		key={id}
																		value={year.value}
																	>
																		<DatePicker.TableCellTrigger className="w-full py-2 rounded-lg hover:bg-indigo-500/20 text-slate-300 transition-colors cursor-pointer aria-selected:bg-indigo-600 aria-selected:text-white">
																			{year.label}
																		</DatePicker.TableCellTrigger>
																	</DatePicker.TableCell>
																))}
															</DatePicker.TableRow>
														))}
												</DatePicker.TableBody>
											</DatePicker.Table>
										</>
									)}
								</DatePicker.Context>
							</DatePicker.View>
						</DatePicker.Content>
					</DatePicker.Positioner>
				</Portal>
			</DatePicker.Root>
		</div>
	);
};
