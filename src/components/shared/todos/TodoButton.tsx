"use client";

import { ListTodo } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
	HeaderCountBadge,
	headerIconButtonClass,
} from "@/components/shared/HeaderIconButton";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { countDueTodos, diffTodoEdit, type Todo } from "@/domain/todo/todo";
import {
	type TodoEditPatch,
	useTodoActions,
	useTodosQuery,
} from "@/hooks/queries/useTodosQuery";
import { useTodayKey } from "@/hooks/useTodayKey";
import { TodoFormDialog } from "./TodoFormDialog";
import { TodoPanel } from "./TodoPanel";

type FormState = { mode: "add" } | { mode: "edit"; todo: Todo } | null;

/**
 * Header to-do icon (issue #360): a blue badge with open tasks due today or
 * overdue, a Radix popover panel, and the add/edit dialog.
 *
 * The dialog state lives here, not inside the popover, so the dialog stays
 * open after the popover closes. Focus returns to this button when either
 * the popover or the dialog closes.
 */
export function TodoButton() {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const openingDialogRef = useRef(false);
	const [open, setOpen] = useState(false);
	const [formState, setFormState] = useState<FormState>(null);

	const query = useTodosQuery();
	const todayKey = useTodayKey();
	const todos = query.data ?? [];
	const count = todayKey === null ? 0 : countDueTodos(todos, todayKey);
	const { createTodo, toggleTodo, editTodo, deleteTodo, isTodoBusy } =
		useTodoActions();

	const openDialog = useCallback((next: Exclude<FormState, null>) => {
		openingDialogRef.current = true;
		setOpen(false);
		setFormState(next);
	}, []);

	const handleSubmit = useCallback(
		(values: TodoEditPatch) => {
			if (formState?.mode === "edit") {
				// Diff against the task as it was when the dialog opened, so
				// untouched fields are never sent.
				const patch = diffTodoEdit(formState.todo, values);
				if (Object.keys(patch).length === 0) return true;
				return editTodo(formState.todo.id, patch);
			}
			createTodo(values);
			return true;
		},
		[formState, createTodo, editTodo],
	);

	const editingId = formState?.mode === "edit" ? formState.todo.id : null;
	const label = count > 0 ? `To-do list, ${count} due today` : "To-do list";

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						ref={triggerRef}
						type="button"
						suppressHydrationWarning
						aria-label={label}
						title="To-do list"
						className={headerIconButtonClass(open)}
					>
						<ListTodo className="h-5 w-5" />
						<HeaderCountBadge
							count={count}
							className="bg-blue-500 hover:bg-blue-500"
						/>
					</button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					sideOffset={12}
					aria-label="To-do list"
					className="w-96 p-0 overflow-hidden rounded-2xl border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0c0e] text-black dark:text-white shadow-2xl"
					onCloseAutoFocus={(event) => {
						// Let the dialog take focus instead of bouncing back to the trigger.
						if (openingDialogRef.current) {
							event.preventDefault();
							openingDialogRef.current = false;
						}
					}}
				>
					<TodoPanel
						todos={todos}
						todayKey={todayKey}
						isLoading={query.isLoading}
						isError={query.isError}
						isTodoBusy={isTodoBusy}
						onAdd={() => openDialog({ mode: "add" })}
						onToggle={toggleTodo}
						onEdit={(todo) => openDialog({ mode: "edit", todo })}
						onDelete={deleteTodo}
					/>
				</PopoverContent>
			</Popover>

			<TodoFormDialog
				open={formState !== null}
				mode={formState?.mode ?? "add"}
				todo={formState?.mode === "edit" ? formState.todo : null}
				isBusy={editingId !== null && isTodoBusy(editingId)}
				onOpenChange={(next) => {
					if (!next) setFormState(null);
				}}
				onSubmit={handleSubmit}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					triggerRef.current?.focus();
				}}
			/>
		</>
	);
}
