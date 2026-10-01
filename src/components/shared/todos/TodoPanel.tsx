"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	getTodoTab,
	isTodoOverdue,
	sortTodos,
	type Todo,
	type TodoTab,
} from "@/domain/todo/todo";
import { cn } from "@/lib/utils";
import { formatTodoDue } from "./todoFormat";

const TABS: { id: TodoTab; label: string; empty: string }[] = [
	{ id: "due", label: "Today & overdue", empty: "Nothing due today." },
	{ id: "upcoming", label: "Upcoming", empty: "No upcoming tasks." },
	{ id: "done", label: "Done", empty: "No completed tasks yet." },
];

const ROW_ACTION_CLASS =
	"rounded-md p-1.5 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";

interface TodoPanelProps {
	todos: readonly Todo[];
	todayKey: string | null;
	isLoading: boolean;
	isError: boolean;
	isTodoBusy: (id: string) => boolean;
	onAdd: () => void;
	onToggle: (id: string, isDone: boolean) => void;
	onEdit: (todo: Todo) => void;
	onDelete: (id: string) => void;
}

/** Contents of the header to-do popover: tabs plus the task rows. */
export function TodoPanel({
	todos,
	todayKey,
	isLoading,
	isError,
	isTodoBusy,
	onAdd,
	onToggle,
	onEdit,
	onDelete,
}: TodoPanelProps) {
	const [tab, setTab] = useState<TodoTab>("due");
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const grouped = useMemo(() => {
		const groups: Record<TodoTab, Todo[]> = { due: [], upcoming: [], done: [] };
		if (todayKey === null) return groups;
		for (const todo of sortTodos(todos)) {
			groups[getTodoTab(todo, todayKey)].push(todo);
		}
		return groups;
	}, [todos, todayKey]);

	const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
	const rows = grouped[tab];

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/5">
				<h2 className="text-sm font-semibold text-black dark:text-white">
					To-do list
				</h2>
				<button
					type="button"
					onClick={onAdd}
					className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
				>
					<Plus className="h-3.5 w-3.5" aria-hidden="true" />
					Add task
				</button>
			</div>

			<div
				role="tablist"
				aria-label="To-do filters"
				className="flex gap-1 px-3 pt-2"
			>
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						onClick={() => setTab(t.id)}
						className={cn(
							"rounded-md px-2.5 py-1 text-xs transition-colors",
							tab === t.id
								? "bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium"
								: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5",
						)}
					>
						{t.label}
						<span className="ml-1 text-[10px] opacity-70">
							{grouped[t.id].length}
						</span>
					</button>
				))}
			</div>

			<div
				role="tabpanel"
				aria-label={activeTab.label}
				className="max-h-[400px] overflow-y-auto custom-scrollbar p-2"
			>
				{isLoading ? (
					<p className="px-2 py-6 text-center text-xs text-gray-500">
						Loading tasks…
					</p>
				) : isError && todos.length === 0 ? (
					<p className="px-2 py-6 text-center text-xs text-red-600 dark:text-red-400">
						Could not load tasks.
					</p>
				) : rows.length === 0 ? (
					<p className="px-2 py-6 text-center text-xs text-gray-500">
						{activeTab.empty}
					</p>
				) : (
					<ul className="space-y-1">
						{rows.map((todo) => {
							const busy = isTodoBusy(todo.id);
							const overdue =
								todayKey !== null && isTodoOverdue(todo, todayKey);
							const dueToday = !todo.isDone && todo.dueDate === todayKey;
							const confirming = confirmDeleteId === todo.id && !busy;
							return (
								<li
									key={todo.id}
									aria-busy={busy || undefined}
									data-testid="todo-row"
									className="group relative flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5 focus-within:bg-black/5 dark:focus-within:bg-white/5"
								>
									<Checkbox
										checked={todo.isDone}
										disabled={busy}
										onCheckedChange={(checked) =>
											onToggle(todo.id, checked === true)
										}
										aria-label={`Mark "${todo.title}" as ${todo.isDone ? "not done" : "done"}`}
										className="mt-0.5 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
									/>
									<div className="min-w-0 flex-1">
										<p
											className={cn(
												"text-sm break-words",
												todo.isDone
													? "text-gray-500 line-through"
													: "text-black dark:text-white",
											)}
										>
											{todo.title}
										</p>
										{todo.note && (
											<p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 break-words whitespace-pre-line">
												{todo.note}
											</p>
										)}
										<span
											className={cn(
												"mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
												overdue
													? "bg-red-500/10 text-red-600 dark:text-red-400"
													: dueToday
														? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
														: "bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400",
											)}
										>
											{overdue ? "Overdue · " : dueToday ? "Today · " : ""}
											{formatTodoDue(todo.dueDate, todo.dueTime)}
										</span>
										{confirming && (
											<div className="mt-2 flex items-center gap-2 text-xs">
												<span className="text-gray-700 dark:text-gray-300">
													Delete this task?
												</span>
												<button
													type="button"
													onClick={() => {
														setConfirmDeleteId(null);
														onDelete(todo.id);
													}}
													className="rounded bg-red-500 px-2 py-0.5 font-medium text-white hover:bg-red-600"
												>
													Delete
												</button>
												<button
													type="button"
													onClick={() => setConfirmDeleteId(null)}
													className="rounded px-2 py-0.5 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
												>
													Cancel
												</button>
											</div>
										)}
									</div>
									<div className="flex shrink-0 items-center gap-0.5">
										{busy && (
											<Loader2
												className="h-3.5 w-3.5 animate-spin text-gray-500"
												aria-hidden="true"
											/>
										)}
										<button
											type="button"
											disabled={busy}
											onClick={() => onEdit(todo)}
											aria-label={`Edit "${todo.title}"`}
											className={cn(
												ROW_ACTION_CLASS,
												"hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10",
											)}
										>
											<Pencil className="h-3.5 w-3.5" aria-hidden="true" />
										</button>
										<button
											type="button"
											disabled={busy}
											onClick={() => setConfirmDeleteId(todo.id)}
											aria-label={`Delete "${todo.title}"`}
											className={cn(
												ROW_ACTION_CLASS,
												"hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10",
											)}
										>
											<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
