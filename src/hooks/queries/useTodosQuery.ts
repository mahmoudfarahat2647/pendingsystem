import {
	type QueryClient,
	useMutation,
	useMutationState,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
	isTemporaryTodoId,
	TEMPORARY_TODO_ID_PREFIX,
	type Todo,
} from "@/domain/todo/todo";
import { TODOS_QUERY_KEY } from "@/lib/queryClient";
import type { CreateTodoInput } from "@/schemas/todo.schema";
import { todoService } from "@/services/todos/todoService";

/**
 * Header To-Do list data (issue #360).
 *
 * Concurrency rules:
 * - A failed mutation rolls back only the one task it touched — never a
 *   whole-list snapshot — so it cannot undo another pending or successful change.
 * - The list is only refetched once the last pending todo mutation settles.
 * - A per-task guard (`isTodoBusy`) stops a second mutation on a task that
 *   already has a pending update/delete, and stops any mutation on a temporary
 *   (not-yet-created) task. Different tasks stay independent.
 */

export const TODO_MUTATION_KEY = ["todos"] as const;
const CREATE_KEY = [...TODO_MUTATION_KEY, "create"] as const;
const UPDATE_KEY = [...TODO_MUTATION_KEY, "update"] as const;
const DELETE_KEY = [...TODO_MUTATION_KEY, "delete"] as const;

export interface TodoEditPatch {
	title: string;
	note: string | null;
	dueDate: string;
	dueTime: string | null;
}

type UpdateVariables =
	| { id: string; kind: "toggle"; isDone: boolean }
	| { id: string; kind: "edit"; patch: TodoEditPatch };

interface DeleteVariables {
	id: string;
}

function getMutationTodoId(variables: unknown): string | undefined {
	if (variables && typeof variables === "object" && "id" in variables) {
		const id = (variables as { id: unknown }).id;
		return typeof id === "string" ? id : undefined;
	}
	return undefined;
}

/** Synchronous read of the mutation cache, so a double-click cannot slip through. */
function hasPendingMutationFor(queryClient: QueryClient, id: string): boolean {
	return queryClient
		.getMutationCache()
		.findAll({ mutationKey: TODO_MUTATION_KEY, status: "pending" })
		.some((mutation) => getMutationTodoId(mutation.state.variables) === id);
}

function isLastPendingTodoMutation(queryClient: QueryClient): boolean {
	return queryClient.isMutating({ mutationKey: TODO_MUTATION_KEY }) <= 1;
}

/**
 * Field-by-field equality. Reference equality is not enough: React Query's
 * structural sharing copies changed objects inside `setQueryData`, so the
 * cached task is never the exact object a mutation wrote.
 */
function isSameTodo(a: Todo, b: Todo): boolean {
	return (Object.keys(b) as (keyof Todo)[]).every((key) => a[key] === b[key]);
}

function replaceTodo(todos: Todo[] | undefined, id: string, next: Todo) {
	return (todos ?? []).map((todo) => (todo.id === id ? next : todo));
}

export function useTodosQuery() {
	return useQuery({
		queryKey: TODOS_QUERY_KEY,
		queryFn: () => todoService.list(),
		refetchInterval: 60_000,
		refetchOnWindowFocus: true,
	});
}

function useSettleTodos() {
	const queryClient = useQueryClient();
	return useCallback(() => {
		if (isLastPendingTodoMutation(queryClient)) {
			void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
		}
	}, [queryClient]);
}

export function useCreateTodoMutation() {
	const queryClient = useQueryClient();
	const settle = useSettleTodos();

	return useMutation({
		mutationKey: CREATE_KEY,
		mutationFn: (input: CreateTodoInput) => todoService.create(input),
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
			const now = new Date().toISOString();
			const optimistic: Todo = {
				id: `${TEMPORARY_TODO_ID_PREFIX}${now}-${Math.random().toString(36).slice(2)}`,
				title: input.title.trim(),
				note: input.note?.trim() || null,
				dueDate: input.dueDate,
				dueTime: input.dueTime ?? null,
				isDone: false,
				doneAt: null,
				createdAt: now,
				updatedAt: now,
			};
			queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) => [
				...old,
				optimistic,
			]);
			return { tempId: optimistic.id };
		},
		onSuccess: (created, _input, context) => {
			if (!context) return;
			queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old) =>
				replaceTodo(old, context.tempId, created),
			);
		},
		onError: (_error, _input, context) => {
			if (context) {
				queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
					old.filter((todo) => todo.id !== context.tempId),
				);
			}
			toast.error("Failed to add task");
		},
		onSettled: settle,
	});
}

export function useUpdateTodoMutation() {
	const queryClient = useQueryClient();
	const settle = useSettleTodos();

	return useMutation({
		mutationKey: UPDATE_KEY,
		mutationFn: (variables: UpdateVariables) =>
			todoService.update(
				variables.id,
				variables.kind === "toggle"
					? { isDone: variables.isDone }
					: variables.patch,
			),
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
			const previous = queryClient
				.getQueryData<Todo[]>(TODOS_QUERY_KEY)
				?.find((todo) => todo.id === variables.id);
			if (!previous) return { previous: undefined, optimistic: undefined };

			const optimistic: Todo =
				variables.kind === "toggle"
					? {
							...previous,
							isDone: variables.isDone,
							doneAt: variables.isDone ? new Date().toISOString() : null,
						}
					: { ...previous, ...variables.patch };
			queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old) =>
				replaceTodo(old, variables.id, optimistic),
			);
			return { previous, optimistic };
		},
		onSuccess: (updated, variables) => {
			queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old) =>
				replaceTodo(old, variables.id, updated),
			);
		},
		onError: (_error, variables, context) => {
			const { previous, optimistic } = context ?? {};
			if (previous && optimistic) {
				// Only undo our own optimistic write; leave anything newer alone.
				queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old) =>
					(old ?? []).map((todo) =>
						todo.id === variables.id && isSameTodo(todo, optimistic)
							? previous
							: todo,
					),
				);
			}
			toast.error("Failed to update task");
		},
		onSettled: settle,
	});
}

export function useDeleteTodoMutation() {
	const queryClient = useQueryClient();
	const settle = useSettleTodos();

	return useMutation({
		mutationKey: DELETE_KEY,
		mutationFn: (variables: DeleteVariables) =>
			todoService.remove(variables.id),
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
			const previous = queryClient
				.getQueryData<Todo[]>(TODOS_QUERY_KEY)
				?.find((todo) => todo.id === variables.id);
			queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
				old.filter((todo) => todo.id !== variables.id),
			);
			return { previous };
		},
		onError: (_error, variables, context) => {
			const previous = context?.previous;
			if (previous) {
				queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
					old.some((todo) => todo.id === variables.id)
						? old
						: [...old, previous],
				);
			}
			toast.error("Failed to delete task");
		},
		onSettled: settle,
	});
}

/**
 * The guarded actions every UI surface uses. Each returns `false` (and starts
 * nothing) when the task is temporary or already has a pending update/delete.
 */
export function useTodoActions() {
	const queryClient = useQueryClient();
	const createMutation = useCreateTodoMutation();
	const updateMutation = useUpdateTodoMutation();
	const deleteMutation = useDeleteTodoMutation();

	const pendingIds = useMutationState({
		filters: { mutationKey: TODO_MUTATION_KEY, status: "pending" },
		select: (mutation) => getMutationTodoId(mutation.state.variables),
	});
	const busyIds = useMemo(
		() =>
			new Set(pendingIds.filter((id): id is string => typeof id === "string")),
		[pendingIds],
	);

	const isTodoBusy = useCallback(
		(id: string) => isTemporaryTodoId(id) || busyIds.has(id),
		[busyIds],
	);

	const canMutate = useCallback(
		(id: string) =>
			!isTemporaryTodoId(id) && !hasPendingMutationFor(queryClient, id),
		[queryClient],
	);

	const { mutate: create } = createMutation;
	const { mutate: update } = updateMutation;
	const { mutate: remove } = deleteMutation;

	const createTodo = useCallback(
		(input: CreateTodoInput) => create(input),
		[create],
	);

	const toggleTodo = useCallback(
		(id: string, isDone: boolean) => {
			if (!canMutate(id)) return false;
			update({ id, kind: "toggle", isDone });
			return true;
		},
		[canMutate, update],
	);

	const editTodo = useCallback(
		(id: string, patch: TodoEditPatch) => {
			if (!canMutate(id)) return false;
			update({ id, kind: "edit", patch });
			return true;
		},
		[canMutate, update],
	);

	const deleteTodo = useCallback(
		(id: string) => {
			if (!canMutate(id)) return false;
			remove({ id });
			return true;
		},
		[canMutate, remove],
	);

	return { createTodo, toggleTodo, editTodo, deleteTodo, isTodoBusy };
}
