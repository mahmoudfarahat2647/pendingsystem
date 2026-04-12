# Add Reorder Button to Global Search Toolbar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Reorder button to the global search toolbar (`SearchResultsView`) that works identically to how Reorder works in the Main Sheet — prompts for a reason, then moves selected rows to the "orders" stage with status "Reorder" and a tagged note.

**Architecture:** Three-file change. `SearchToolbar` gets the new `onReorder` prop and button. `useSearchResultsState` gets the modal state and async handler (following the exact same pattern as the existing `handleBookingConfirm`/`handleArchiveConfirm` — direct `saveOrderMutation.mutateAsync`, no draft session). `SearchResultsView` wires the prop and hosts the inline Dialog identical to the one in Main Sheet.

**Tech Stack:** React, TypeScript, Vitest, shadcn/ui Dialog/Input/Label/Button, lucide-react RotateCcw icon, Sonner toast, React Query (`useSaveOrderMutation`), `appendTaggedUserNote` / `getEffectiveNoteHistory` from `@/lib/orderWorkflow`.

---

## Context

The user frequently searches for VINs or part numbers received from their boss, then needs to reorder those parts. Booking is already in the search toolbar (green calendar icon). Reorder is missing. The feature should be invisible until needed: same disabled/enabled gates as other stage actions (`isStageActionDisabled = selectedCount === 0 || !isSameSource`), same orange styling as the Main Sheet reorder button, and the same reason-input dialog.

---

## File Map

| File | Change |
|---|---|
| `src/components/shared/search/SearchToolbar.tsx` | Add `onReorder` prop + `RotateCcw` orange button |
| `src/components/shared/search/hooks/useSearchResultsState.ts` | Add `showReorderModal` + `reorderReason` state + `handleReorderConfirm` handler |
| `src/components/shared/SearchResultsView.tsx` | Pass `onReorder` to toolbar; add inline `<Dialog>` for reason input |

---

## Task 1: Add state and handler to `useSearchResultsState`

**Files:**
- Modify: `src/components/shared/search/hooks/useSearchResultsState.ts`

- [ ] **Step 1: Add modal and reason state**

Inside `useSearchResultsState`, after the existing modal state block (lines 62–64):

```typescript
// Existing:
const [showBookingModal, setShowBookingModal] = useState(false);
const [showArchiveModal, setShowArchiveModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Add these two lines:
const [showReorderModal, setShowReorderModal] = useState(false);
const [reorderReason, setReorderReason] = useState("");
```

- [ ] **Step 2: Add `handleReorderConfirm` handler**

Add this after `handleSendToCallList` (around line 415) and before `handleDeleteConfirm`:

```typescript
const handleReorderConfirm = useCallback(async () => {
	if (selectedRows.length === 0 || !isSameSource || !reorderReason.trim()) return;
	try {
		await Promise.all(
			selectedRows.map((row) => {
				const freshRow = searchResults.find((r) => r.id === row.id) ?? row;
				return saveOrderMutation.mutateAsync({
					id: row.id,
					updates: {
						status: "Reorder",
						noteHistory: appendTaggedUserNote(
							getEffectiveNoteHistory(freshRow),
							`Reorder Reason: ${reorderReason}`,
							"reorder",
						),
					},
					stage: "orders",
					sourceStage: row.stage as OrderStage,
				});
			}),
		);
		const count = selectedRows.length;
		setShowReorderModal(false);
		setReorderReason("");
		setSelectedRows([]);
		toast.success(`${count} row(s) sent back to Orders (Reorder)`);
	} catch (_error) {
		toast.error("Reorder failed");
	}
}, [selectedRows, isSameSource, reorderReason, searchResults, saveOrderMutation]);
```

- [ ] **Step 3: Export the new state and handler from the return object**

Add to the `return` statement (after the existing `handleSendToCallList` entry):

```typescript
// Add these entries:
showReorderModal,
setShowReorderModal,
reorderReason,
setReorderReason,
handleReorderConfirm,
```

- [ ] **Step 4: Run type-check to confirm no errors**

```bash
npm run type-check
```

Expected: no errors. If you see "Cannot find name 'setSelectedRows'" — it already exists; make sure you're referencing the existing one, not re-declaring it.

---

## Task 2: Add Reorder button to `SearchToolbar`

**Files:**
- Modify: `src/components/shared/search/SearchToolbar.tsx`

- [ ] **Step 1: Import `RotateCcw` from lucide-react**

The current import line (line 1) is:

```typescript
import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	Phone,
	Tag,
	Trash2,
} from "lucide-react";
```

Add `RotateCcw` to the import:

```typescript
import {
	Archive,
	Calendar,
	CheckCircle,
	Download,
	Filter,
	Phone,
	RotateCcw,
	Tag,
	Trash2,
} from "lucide-react";
```

- [ ] **Step 2: Add `onReorder` to the interface**

The interface block (lines 29–43):

```typescript
interface SearchToolbarProps {
	selectedCount: number;
	isSameSource: boolean;
	disabledReason: string;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onReserve: () => void;
	onUpdateStatus?: (status: string) => void;
	partStatuses?: PartStatusDef[];
	showFilters: boolean;
}
```

Add `onReorder: () => void;` after `onSendToCallList`:

```typescript
interface SearchToolbarProps {
	selectedCount: number;
	isSameSource: boolean;
	disabledReason: string;
	onBooking: () => void;
	onArchive: () => void;
	onSendToCallList: () => void;
	onReorder: () => void;
	onDelete: () => void;
	onExtract: () => void;
	onFilterToggle: () => void;
	onReserve: () => void;
	onUpdateStatus?: (status: string) => void;
	partStatuses?: PartStatusDef[];
	showFilters: boolean;
}
```

- [ ] **Step 3: Destructure `onReorder` in the component signature**

Add `onReorder,` after `onSendToCallList,` in the destructuring block (around line 63).

- [ ] **Step 4: Add the Reorder button in JSX**

Insert a new `<Tooltip>` block immediately after the Send to Call List tooltip block (after line ~143). Place it between the Call List button and the Extract button:

```tsx
<Tooltip>
	<TooltipTrigger asChild>
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"h-8 w-8 transition-colors",
				!isStageActionDisabled
					? "text-orange-500/80 hover:text-orange-500 hover:bg-orange-500/10"
					: "text-gray-600 cursor-not-allowed opacity-50",
			)}
			disabled={isStageActionDisabled}
			onClick={onReorder}
		>
			<RotateCcw className="h-4 w-4" />
		</Button>
	</TooltipTrigger>
	<TooltipContent>
		{!isSameSource && selectedCount > 0 ? disabledReason : "Reorder"}
	</TooltipContent>
</Tooltip>
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

Expected: no errors. The only expected complaint before the next task is in `SearchResultsView.tsx` where `onReorder` is not yet passed — that will be fixed in Task 3.

---

## Task 3: Wire up `SearchResultsView` — prop + dialog

**Files:**
- Modify: `src/components/shared/SearchResultsView.tsx`

- [ ] **Step 1: Destructure the new values from the hook**

The `useSearchResultsState()` destructuring block (lines 16–53). Add the five new exports after `handleSendToCallList`:

```typescript
const {
	// … existing …
	handleSendToCallList,
	handleReorderConfirm,   // add
	showReorderModal,       // add
	setShowReorderModal,    // add
	reorderReason,          // add
	setReorderReason,       // add
	handleDeleteConfirm,
	// … rest unchanged …
} = useSearchResultsState();
```

- [ ] **Step 2: Pass `onReorder` to `SearchToolbar`**

The `<SearchToolbar>` block (lines 66–80). Add `onReorder`:

```tsx
<SearchToolbar
	selectedCount={selectedRows.length}
	isSameSource={isSameSource}
	disabledReason={disabledReason}
	onBooking={() => setShowBookingModal(true)}
	onArchive={() => setShowArchiveModal(true)}
	onSendToCallList={handleSendToCallList}
	onReorder={() => setShowReorderModal(true)}
	onDelete={() => setShowDeleteConfirm(true)}
	onExtract={handleExtract}
	onFilterToggle={() => setShowFilters((v) => !v)}
	onReserve={handleReserve}
	onUpdateStatus={handleBulkStatusUpdate}
	partStatuses={partStatuses}
	showFilters={showFilters}
/>
```

- [ ] **Step 3: Add required imports for the dialog**

Check the top of `SearchResultsView.tsx` for existing shadcn imports. You need these available:
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` from `@/components/ui/dialog`
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`
- `Button` is already imported

Add any missing ones to the existing import block.

- [ ] **Step 4: Add the Reorder Dialog below the `<ConfirmDialog />`**

After the `</ConfirmDialog>` (around line 136) and before `<RowModals`:

```tsx
{/* Reorder Reason Modal */}
<Dialog open={showReorderModal} onOpenChange={setShowReorderModal}>
	<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
		<DialogHeader>
			<DialogTitle className="text-orange-500">
				Reorder - Reason Required
			</DialogTitle>
		</DialogHeader>
		<div className="space-y-4">
			<div>
				<Label>Reason for Reorder</Label>
				<Input
					value={reorderReason}
					onChange={(e) => setReorderReason(e.target.value)}
					placeholder="e.g., Customer called back, error on main sheet"
					className="bg-white/5 border-white/10 text-white"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button
				variant="outline"
				onClick={() => setShowReorderModal(false)}
				className="border-white/20 text-white hover:bg-white/10"
			>
				Cancel
			</Button>
			<Button
				variant="renault"
				onClick={handleReorderConfirm}
				disabled={!reorderReason.trim()}
			>
				Confirm Reorder
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
```

- [ ] **Step 5: Run full quality gates**

```bash
npm run type-check && npm run lint && npm run build
```

Expected: all pass with no errors. Fix any lint warnings before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/search/SearchToolbar.tsx \
        src/components/shared/search/hooks/useSearchResultsState.ts \
        src/components/shared/SearchResultsView.tsx
git commit -m "feat: add Reorder button to global search toolbar"
```

---

## Task 4: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify button appears and disabled states work**

1. Open the app and click the search bar (header).
2. Type a search term that returns results from a single stage (e.g., a VIN from Main Sheet).
3. Confirm the orange `RotateCcw` Reorder button appears in the toolbar.
4. With no rows selected: confirm the button is disabled (grayed out, `opacity-50`).
5. Select one or more rows: confirm the button becomes orange and active.
6. Select rows from two different sources: confirm the button is disabled and tooltip says "Mixed sources selected".

- [ ] **Step 3: Verify the happy path**

1. Select one or more Main Sheet rows in search.
2. Click Reorder.
3. Confirm the dialog opens with title "Reorder - Reason Required".
4. Confirm "Confirm Reorder" button is disabled when reason is empty.
5. Type a reason and confirm the button enables.
6. Click "Confirm Reorder".
7. Confirm toast: "N row(s) sent back to Orders (Reorder)".
8. Navigate to Orders page — confirm the row(s) appear there with status "Reorder".
9. Open the note history for a row — confirm the tagged "reorder" note containing "Reorder Reason: <your text>" is present.

- [ ] **Step 4: Verify Cancel**

Open the dialog, type a reason, click Cancel — confirm dialog closes, no rows moved, no toast.

---

## Verification Summary

| Check | Command / Action |
|---|---|
| Types | `npm run type-check` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Unit tests | `npm run test` |
| Smoke: button disabled states | See Task 4 Step 2 |
| Smoke: happy path | See Task 4 Step 3 |
| Smoke: cancel | See Task 4 Step 4 |
