# Header To-Do List

A to-do list for the whole system, opened from the header's list icon (issue `#360`). It is separate from the notification bell. It holds general tasks such as "call customer X next Sunday" or "review the Freeze tab".

The icon sits between the Export button and the Booking Inquiry button. The header order is: Refresh, Export, To-Do List, Booking Inquiry, Notifications.

## Behaviour

- **Task fields:** a title (1–200 characters), an optional note (up to 1000 characters), a due date and an optional time, picked as hour (01–12), minute (5-minute steps) and AM/PM like the order reminder, and stored as 24h `HH:mm`. Tasks are not linked to a tab or an order.
  - The dialog converts between the stored 24h value and the 12h picker parts: 12 AM is stored as `00:00`, 12 PM as `12:00`. Opening a task for edit shows its stored time in AM/PM, and saving it unchanged sends the same 24h value back.
  - Times are shown in the panel as AM/PM, for example `Sun 4 Oct · 2:30 PM`.
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
  - An "Add time" switch adds an optional time, chosen with Hour, Minute and AM/PM selects (default 09:00 AM).
- **Shared list:** every admin sees the same list on every device. It refetches every 60s and on window focus.
- **Language:** English only, like the rest of the Header.

## Data

- **Table:** `public.todos` (migration `supabase/migrations/20261001_add_todos.sql`, applied to the live project).
  - `due_date` is a plain `date` (a local calendar day), so a due date never shifts with timezones.
  - `due_time` is optional text in 24h `HH:mm` format. The 12h display is a UI concern only; nothing 12h is stored or sent to the API.
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
| Domain (pure) | `src/domain/todo/todo.ts`: `isRealCalendarDate`, `countDueTodos`, `sortTodos`, `getTodoTab`, `isTemporaryTodoId`, quick-date helpers, 12-hour time helpers (`toTwelveHour`, `fromTwelveHour`, `formatTwelveHour`, plus the `Meridiem` and `TwelveHourTime` types) |
| Schemas | `src/schemas/todo.schema.ts`: `CreateTodoSchema` and `UpdateTodoSchema`, shared by the form and the API (both reject impossible dates such as `2026-02-30`) |
| Repository (server) | `src/services/todos/todoRepository.ts`: `createTodoRepository`, `buildTodoUpdatePatch`, `TodoNotFoundError` |
| Client service | `src/services/todos/todoService.ts` |
| Hooks | `src/hooks/queries/useTodosQuery.ts` (`TODOS_QUERY_KEY` is defined in `src/lib/queryClient.ts`), `src/hooks/useTodayKey.ts` |
| UI | `src/components/shared/todos/`: `TodoButton`, `TodoPanel`, `TodoFormDialog`, `todoFormat.ts` (date-key and due-label formatting, with the time shown as AM/PM) |
| Header placement | `src/components/shared/Header.tsx`: `TodoButton` renders after the Export dropdown and before `BookingInquiryButton` |

## Concurrency rules (`useTodosQuery.ts`)

- **Rollback is per task.** A failed create, update or delete rolls back only the task it touched, never a snapshot of the whole list. One failure therefore cannot undo another task's pending or successful change.
  - Update rollback compares fields one by one, not by object reference. React Query's structural sharing copies objects inside `setQueryData`, so a reference check would never match.
- **Refetch timing.** The list refetches only after the last pending todo mutation settles.
- **No stale reads during a save.** The list fetch (`listTodosWhenIdle`) never applies a server response while any todo mutation is pending, because that snapshot can predate the write and would undo an optimistic change or drop a new task. It waits until every pending mutation settles, then reads again. This covers the 60-second poll, window focus and reconnect.
- **Robust success handlers.** A successful create inserts the saved task even if its temporary row is gone; a successful delete removes the task even if something re-added it.
- **Edits send only changed fields** (`diffTodoEdit`, against the task as it was when the dialog opened), so an edit never overwrites another admin's change to a field you didn't touch. Saving with no changes sends nothing.
- **Idempotent delete.** Deleting a task another admin already deleted succeeds (`204`) instead of showing an error and bringing it back.
- **Per-task guard.** `useTodoActions()` exposes `toggleTodo`, `editTodo` and `deleteTodo`. Each returns `false` and starts nothing when:
  - the task already has a pending update or delete. This is read synchronously from the mutation cache, so a double-click cannot slip through; or
  - the task is temporary, meaning its create has not finished yet.

  Different tasks never block each other. The UI also disables a busy row's controls and marks the row `aria-busy`.

## Dialog lifecycle

- `TodoButton` owns the dialog state, so the dialog stays open after the popover closes.
- Escape closes the popover and returns focus to the header button. Closing the dialog also returns focus there.

## Tests

`src/test/todos/` covers:
- domain rules and schemas, including the 12-hour helpers (24h ↔ AM/PM conversion for midnight and noon, a round trip over all 24 hours, and the display label);
- the repository's timestamp rules;
- API routes: 401, 400, 404 and the happy paths;
- the hook's rollback and per-task guard;
- the badge, including midnight rollover;
- panel and dialog interaction and accessibility, including that times display as AM/PM while an unchanged edit still saves the 24h value.
