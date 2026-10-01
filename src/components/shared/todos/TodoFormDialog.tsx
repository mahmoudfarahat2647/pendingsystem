"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, ListTodo } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/origin-calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/origin-select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toLocalDateKey } from "@/domain/booking/bookingInquiry";
import {
	addDaysToDateKey,
	getNextSundayKey,
	type Todo,
} from "@/domain/todo/todo";
import type { TodoEditPatch } from "@/hooks/queries/useTodosQuery";
import { cn } from "@/lib/utils";
import {
	CreateTodoSchema,
	TODO_NOTE_MAX,
	TODO_TITLE_MAX,
} from "@/schemas/todo.schema";
import { dateKeyToLocalDate } from "./todoFormat";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
	String(i * 5).padStart(2, "0"),
);
const DEFAULT_TIME = { h: "09", m: "00" };

const FIELD_CLASS =
	"bg-gray-100 dark:bg-[#2c2c2e] border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200";
const LABEL_CLASS =
	"text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider";

interface TodoFormDialogProps {
	open: boolean;
	mode: "add" | "edit";
	/** The task being edited (edit mode only). */
	todo?: Todo | null;
	/** True while the edited task has a pending mutation: Save is disabled. */
	isBusy?: boolean;
	onOpenChange: (open: boolean) => void;
	/** Returns `false` when the action was refused (task busy); the dialog stays open. */
	onSubmit: (values: TodoEditPatch) => boolean;
	onCloseAutoFocus?: (event: Event) => void;
}

/**
 * Add/edit dialog for a header to-do task. The due date is picked from a
 * calendar only (no free-text entry), so no stale date can hide behind
 * unparseable text; the values are still validated with `CreateTodoSchema`.
 */
export function TodoFormDialog({
	open,
	mode,
	todo,
	isBusy = false,
	onOpenChange,
	onSubmit,
	onCloseAutoFocus,
}: TodoFormDialogProps) {
	const titleId = useId();
	const noteId = useId();
	const timeSwitchId = useId();
	const errorId = useId();

	const [title, setTitle] = useState("");
	const [note, setNote] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [hasTime, setHasTime] = useState(false);
	const [time, setTime] = useState(DEFAULT_TIME);
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [todayKey, setTodayKey] = useState(() => toLocalDateKey(new Date()));

	// Reset the form each time the dialog opens.
	useEffect(() => {
		if (!open) return;
		const today = toLocalDateKey(new Date());
		setTodayKey(today);
		setError(null);
		setCalendarOpen(false);
		if (mode === "edit" && todo) {
			setTitle(todo.title);
			setNote(todo.note ?? "");
			setDueDate(todo.dueDate);
			setHasTime(todo.dueTime !== null);
			const [h, m] = (todo.dueTime ?? "09:00").split(":");
			setTime({ h, m });
		} else {
			setTitle("");
			setNote("");
			setDueDate(today);
			setHasTime(false);
			setTime(DEFAULT_TIME);
		}
	}, [open, mode, todo]);

	const quickDates = [
		{ label: "Today", key: todayKey },
		{ label: "Tomorrow", key: addDaysToDateKey(todayKey, 1) },
		{ label: "Next Sunday", key: getNextSundayKey(todayKey) },
	];

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (isBusy) return;
		const parsed = CreateTodoSchema.safeParse({
			title,
			note,
			dueDate,
			dueTime: hasTime ? `${time.h}:${time.m}` : null,
		});
		if (!parsed.success) {
			setError(
				dueDate
					? (parsed.error.issues[0]?.message ?? "Invalid task")
					: "Pick a due date",
			);
			return;
		}
		setError(null);
		const accepted = onSubmit({
			title: parsed.data.title,
			note: parsed.data.note,
			dueDate: parsed.data.dueDate,
			dueTime: parsed.data.dueTime,
		});
		if (accepted) onOpenChange(false);
		else setError("This task is being updated. Try again in a moment.");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="bg-white dark:bg-[#1c1c1e] text-black dark:text-white border-black/10 dark:border-white/10 sm:max-w-md"
				onCloseAutoFocus={onCloseAutoFocus}
			>
				<DialogHeader>
					<DialogTitle className="text-lg font-medium flex items-center gap-2">
						<ListTodo className="h-5 w-5 text-blue-500" aria-hidden="true" />
						{mode === "edit" ? "Edit task" : "Add task"}
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						System-wide to-do, visible to every user.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					noValidate
					className="space-y-5"
					aria-describedby={error ? errorId : undefined}
				>
					<div className="space-y-2">
						<Label htmlFor={titleId} className={LABEL_CLASS}>
							Title
						</Label>
						<Input
							id={titleId}
							value={title}
							maxLength={TODO_TITLE_MAX}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Call customer about booking"
							className={FIELD_CLASS}
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={noteId} className={LABEL_CLASS}>
							Note (optional)
						</Label>
						<Textarea
							id={noteId}
							value={note}
							maxLength={TODO_NOTE_MAX}
							onChange={(e) => setNote(e.target.value)}
							rows={3}
							className={cn(FIELD_CLASS, "resize-none")}
						/>
					</div>

					<fieldset className="space-y-2">
						<legend className={cn(LABEL_CLASS, "mb-2")}>Due date</legend>
						<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									aria-label={
										dueDate
											? `Due date: ${format(dateKeyToLocalDate(dueDate), "PPP")}`
											: "Pick a due date"
									}
									className={cn(
										FIELD_CLASS,
										"w-full justify-start text-left font-normal hover:bg-gray-200 dark:hover:bg-[#3c3c3e]",
										!dueDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
									{dueDate
										? format(dateKeyToLocalDate(dueDate), "PPP")
										: "Pick a date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0 w-fit border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-black dark:text-white">
								<Calendar
									mode="single"
									selected={dueDate ? dateKeyToLocalDate(dueDate) : undefined}
									onSelect={(date) => {
										if (date) setDueDate(toLocalDateKey(date));
										setCalendarOpen(false);
									}}
									initialFocus
									weekStartsOn={0}
								/>
							</PopoverContent>
						</Popover>
						<div className="flex flex-wrap gap-2">
							{quickDates.map((quick) => (
								<button
									key={quick.label}
									type="button"
									onClick={() => setDueDate(quick.key)}
									aria-pressed={dueDate === quick.key}
									className={cn(
										"rounded-full border px-3 py-1 text-xs transition-colors",
										dueDate === quick.key
											? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
											: "border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
									)}
								>
									{quick.label}
								</button>
							))}
						</div>
					</fieldset>

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Switch
								id={timeSwitchId}
								checked={hasTime}
								onCheckedChange={setHasTime}
							/>
							<Label
								htmlFor={timeSwitchId}
								className="text-sm text-gray-700 dark:text-gray-300"
							>
								Add time
							</Label>
						</div>
						{hasTime && (
							<div className="flex items-center gap-2">
								<Clock
									className="h-4 w-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<Select
									value={time.h}
									onValueChange={(h) => setTime((t) => ({ ...t, h }))}
								>
									<SelectTrigger
										aria-label="Hour"
										className={cn(FIELD_CLASS, "w-[70px]")}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-white dark:bg-[#1c1c1e] border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200">
										{HOURS.map((h) => (
											<SelectItem key={h} value={h}>
												{h}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<span className="text-gray-600 dark:text-gray-400">:</span>
								<Select
									value={time.m}
									onValueChange={(m) => setTime((t) => ({ ...t, m }))}
								>
									<SelectTrigger
										aria-label="Minute"
										className={cn(FIELD_CLASS, "w-[70px]")}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-white dark:bg-[#1c1c1e] border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200">
										{MINUTES.map((m) => (
											<SelectItem key={m} value={m}>
												{m}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>

					{isBusy && (
						<p className="text-xs text-amber-600 dark:text-amber-400">
							This task is being updated…
						</p>
					)}
					{error && (
						<p
							id={errorId}
							role="alert"
							className="text-xs text-red-600 dark:text-red-400"
						>
							{error}
						</p>
					)}

					<DialogFooter className="gap-2 sm:gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							className="text-gray-700 dark:text-gray-300"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isBusy}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{mode === "edit" ? "Save" : "Add task"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
