# Plan: Fix & Reorganize Backup & Reports Feature

## Context

The user reports that email delivery from "Send Backup Now" is not working (April 7, 2026). The success toast appeared (workflow dispatch succeeded), and SMTP secrets are configured in GitHub. The email still didn't arrive.

**Root cause analysis**: The GitHub Actions workflow dispatches successfully, but something fails during execution (SMTP auth, empty recipients, missing settings row). The current UI provides **zero feedback** about what happens after dispatch - success toast only means "GitHub accepted the dispatch request", not "email was sent". The actual error is invisible.

Additionally, the user wants the feature files organized "in its own folder" for better maintainability. Currently, report-related files are spread across `services/`, `hooks/queries/`, `test/`, `store/slices/`, and `components/reports/`.

**User action needed**: Check GitHub Actions logs at the repo's Actions tab > "Backup & Reports" workflow to see the exact failure reason.

## Phase 1: Fix Error Feedback (Root Cause of "Not Delivered")

The error propagation chain is broken at the last link:
- API route returns specific errors ("Missing GITHUB_PAT", "Token lacks permissions", etc.)
- Service layer extracts and re-throws these messages
- **ManualActionCard catches but ignores the message** -> shows generic "Failed to start backup"

### File: `src/components/reports/ManualActionCard.tsx`

Change lines 31-33 from:
```tsx
} catch {
    toast.error("Failed to start backup");
}
```
to:
```tsx
} catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start backup";
    toast.error(message);
}
```

### File: `src/test/ManualActionCard.test.tsx` (line 178)

Update existing test assertion to match the now-surfaced error message:
```tsx
// was: expect(toast.error).toHaveBeenCalledWith("Failed to start backup");
expect(toast.error).toHaveBeenCalledWith("Backup failed");
```

This matches the mock rejection `new Error("Backup failed")` on line 172.

## Phase 2: Improve Email Validation

### File: `src/components/reports/RecipientsCard.tsx`

Replace weak `includes("@")` check (line 34) with regex + feedback:
```tsx
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handleAddEmail = () => {
    if (EMAIL_RE.test(emailInput.trim())) {
        addEmailRecipientMutation.mutate(emailInput.trim());
        setEmailInput("");
    } else if (emailInput.trim()) {
        toast.error("Please enter a valid email address");
    }
};
```

Add `import { toast } from "sonner"` to imports.

### File: `src/test/RecipientsCard.test.tsx`

- Add `sonner` mock (matching pattern from ManualActionCard test)
- Update "does not add invalid email" test: `"user@"` should now also be rejected
- Add test for toast error feedback on invalid email

## Phase 3: Reorganize Files Into Sub-Folders

Using the existing directory convention (reports/ sub-folder within each top-level dir):

| Current Path | New Path |
|---|---|
| `src/services/reportSettingsService.ts` | `src/services/reports/reportSettingsService.ts` |
| `src/hooks/queries/useReportSettingsQuery.ts` | `src/hooks/queries/reports/useReportSettingsQuery.ts` |
| `src/test/reportSettingsService.test.ts` | `src/test/reports/reportSettingsService.test.ts` |
| `src/test/reportSettingsSlice.test.ts` | `src/test/reports/reportSettingsSlice.test.ts` |
| `src/test/BackupReportsTab.test.tsx` | `src/test/reports/BackupReportsTab.test.tsx` |
| `src/test/backupFrequency.test.ts` | `src/test/reports/backupFrequency.test.ts` |
| `src/test/ManualActionCard.test.tsx` | `src/test/reports/ManualActionCard.test.tsx` |
| `src/test/RecipientsCard.test.tsx` | `src/test/reports/RecipientsCard.test.tsx` |
| `src/test/SchedulingCard.test.tsx` | `src/test/reports/SchedulingCard.test.tsx` |

**Stay in place** (framework/architecture constraints):
- `src/components/reports/` - already in own folder
- `src/store/slices/reportSettingsSlice.ts` - part of composed Zustand store
- `src/store/types.ts` - shared type definitions (ReportSettings embedded)
- `src/app/api/trigger-backup/route.ts` - Next.js routing constraint
- `scripts/generate-backup.mjs` - CI script
- `.github/workflows/backup-reports.yml` - GitHub Actions

## Phase 4: Update All Imports

### Production code imports to update:

1. **`src/hooks/queries/reports/useReportSettingsQuery.ts`** (moved file):
   - `@/services/reportSettingsService` -> `@/services/reports/reportSettingsService`

2. **`src/store/slices/reportSettingsSlice.ts`** (not moved, but import target moved):
   - `@/services/reportSettingsService` -> `@/services/reports/reportSettingsService`

3. **`src/components/reports/ManualActionCard.tsx`**:
   - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`

4. **`src/components/reports/RecipientsCard.tsx`**:
   - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`

5. **`src/components/reports/SchedulingCard.tsx`**:
   - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`

### Test file imports to update (all moved to `src/test/reports/`):

6. **`src/test/reports/reportSettingsService.test.ts`**:
   - `@/services/reportSettingsService` -> `@/services/reports/reportSettingsService`
   - Mock path: same update

7. **`src/test/reports/reportSettingsSlice.test.ts`**:
   - `@/services/reportSettingsService` -> `@/services/reports/reportSettingsService`
   - `../store/slices/reportSettingsSlice` -> `../../store/slices/reportSettingsSlice`
   - `../store/types` -> `../../store/types`
   - Mock path: same update for service

8. **`src/test/reports/BackupReportsTab.test.tsx`**:
   - `../components/reports/BackupReportsTab` -> `../../components/reports/BackupReportsTab`
   - Mock paths for `../components/reports/*` -> `../../components/reports/*`

9. **`src/test/reports/ManualActionCard.test.tsx`**:
   - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`
   - `../components/reports/ManualActionCard` -> `../../components/reports/ManualActionCard`
   - `../components/ui/card` -> `../../components/ui/card`
   - Mock paths: same updates

10. **`src/test/reports/RecipientsCard.test.tsx`**:
    - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`
    - `../components/reports/RecipientsCard` -> `../../components/reports/RecipientsCard`
    - `../components/ui/*` -> `../../components/ui/*`
    - Mock paths: same updates

11. **`src/test/reports/SchedulingCard.test.tsx`**:
    - `@/hooks/queries/useReportSettingsQuery` -> `@/hooks/queries/reports/useReportSettingsQuery`
    - `../components/reports/SchedulingCard` -> `../../components/reports/SchedulingCard`
    - `../components/ui/*` -> `../../components/ui/*`
    - `../components/reports/FrequencyPicker` -> `../../components/reports/FrequencyPicker`
    - Mock paths: same updates

12. **`src/test/reports/backupFrequency.test.ts`**: No import changes (self-contained).

### Files NOT affected:
- `src/components/shared/SettingsModal.tsx` - imports `../reports/BackupReportsTab` (no change)
- `src/app/api/trigger-backup/route.ts` - imports only from `@/lib/` (no change)
- `scripts/generate-backup.mjs` - standalone Node script (no change)

## Phase 5: Update Documentation

### `ENGINEERING.md`
- Line 74: Update reference from `reportSettingsService` to note new path
- Line 282: `src/services/reportSettingsService.ts` -> `src/services/reports/reportSettingsService.ts`

### `CLAUDE.md`
- Add convention for feature sub-folders in existing directories
- Update `reportSettingsService.ts` path reference if present

### `FEATURES.md`
- No path references to update (uses logical descriptions)

## Phase 6: Verification

```bash
npm run lint          # Biome check
npm run type-check    # Catches broken imports
npm run test          # All 7 report tests + others must pass
npm run build         # Production build succeeds
```

## Critical Files
- `src/components/reports/ManualActionCard.tsx` - error feedback fix
- `src/components/reports/RecipientsCard.tsx` - email validation fix
- `src/services/reportSettingsService.ts` -> move to `reports/`
- `src/hooks/queries/useReportSettingsQuery.ts` -> move to `reports/`
- 7 test files -> move to `src/test/reports/`
- `ENGINEERING.md` - path updates
- `CLAUDE.md` - convention update
