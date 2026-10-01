# Header To-Do List

A to-do list for the whole system, opened from the header's list icon (issue `#360`). It is separate from the notification bell. It holds general tasks such as "call customer X next Sunday" or "review the Freeze tab".

## Behaviour

- **Task fields:** a title (1–200 characters), an optional note (up to 1000 characters), a due date and an optional time (`HH:mm`, 24h). Tasks are not linked to a tab or an order.
- **Blue badge** on the header icon: the number of open tasks due today plus overdue ones. It shows `9+` above 9. It rolls over at local midnight; the day is re-checked every 60s and on focus or visibility change.
- **Panel** (Radix `Popover`) has three tabs:
  - **Today & overdue**
  - **Upcoming**
  - **Done**
- **Each row** has:
  - a checkbox to mark it done or not done;
  - the title and note;
  - a date chip: red for overdue, blue for today;
  - Edit and Delete buttons, shown on hover or keyboard focus. Delete asks for confirmation inline.
- **Add/edit dialog:**
  - The due date is chosen from a calendar only, with quick buttons for Today, Tomorrow and Next Sunday. There is no free-text date entry.
  - An "Add time" switch adds an optional time.
- **Shared list:** every admin sees the same list on every device. It refetches every 60s and on window focus.
- **Language:** English only, like the rest of the Header.

## Data

- **Table:** `public.todos` (migration `supabase/migrations/20261001_add_todos.sql`, applied to the live project).
  - `due_date` is a plain `date` (a local calendar day), so a due date never shifts with timezones.
  - `due_time` is optional text in `HH:mm` format.
- **Access:** RLS is enabled with **no** client policies. The only way in is the authenticated API, which uses the service role:
  - `GET` and `POST /api/todos`
  - `PATCH` and `DELETE /api/todos/[id]`
  - Each handler checks `auth.api.getSession` (401 if not signed in) and validates input with Zod (400 on invalid input). A missing task returns 404.
- **Timestamps:**
  - Every update writes `updated_at`.
  - `done_at` changes only when the patch includes `isDone`: it is set when a task is marked done and cleared when it is marked not done.
  - The edit form never sends `isDone`, so editing a done task keeps its `done_at`.

## Code map

| Layer | File |
|---|---|
| Domain (pure) | `src/domain/todo/todo.ts`: `isRealCalendarDate`, `countDueTodos`, `sortTodos`, `getTodoTab`, `isTemporaryTodoId`, quick-date helpers |
| Schemas | `src/schemas/todo.schema.ts`: `CreateTodoSchema` and `UpdateTodoSchema`, shared by the form and the API (both reject impossible dates such as `2026-02-30`) |
| Repository (server) | `src/services/todos/todoRepository.ts`: `createTodoRepository`, `buildTodoUpdatePatch`, `TodoNotFoundError` |
| Client service | `src/services/todos/todoService.ts` |
| Hooks | `src/hooks/queries/useTodosQuery.ts` (`TODOS_QUERY_KEY` is defined in `src/lib/queryClient.ts`), `src/hooks/useTodayKey.ts` |
| UI | `src/components/shared/todos/`: `TodoButton`, `TodoPanel`, `TodoFormDialog`, `todoFormat.ts` (date-key and due-label formatting) |

## Concurrency rules (`useTodosQuery.ts`)

- **Rollback is per task.** A failed create, update or delete rolls back only the task it touched, never a snapshot of the whole list. One failure therefore cannot undo another task's pending or successful change.
  - Update rollback compares fields one by one, not by object reference. React Query's structural sharing copies objects inside `setQueryData`, so a reference check would never match.
- **Refetch timing.** The list refetches only after the last pending todo mutation settles.
- **Per-task guard.** `useTodoActions()` exposes `toggleTodo`, `editTodo` and `deleteTodo`. Each returns `false` and starts nothing when:
  - the task already has a pending update or delete. This is read synchronously from the mutation cache, so a double-click cannot slip through; or
  - the task is temporary, meaning its create has not finished yet.

  Different tasks never block each other. The UI also disables a busy row's controls and marks the row `aria-busy`.

## Dialog lifecycle

- `TodoButton` owns the dialog state, so the dialog stays open after the popover closes.
- Escape closes the popover and returns focus to the header button. Closing the dialog also returns focus there.

## Tests

`src/test/todos/` covers:
- domain rules and schemas;
- the repository's timestamp rules;
- API routes: 401, 400, 404 and the happy paths;
- the hook's rollback and per-task guard;
- the badge, including midnight rollover;
- panel and dialog interaction and accessibility.
