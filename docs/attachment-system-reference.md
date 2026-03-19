# Attachment System Reference

This document describes the current attachment system as implemented in the repo today. Treat it as the implementation reference before changing attachment UX, storage behavior, persistence, or workflow rules that depend on attachments.

## Purpose

The attachment system currently does four jobs:

1. lets users attach either an external link/path or an uploaded file to an order row
2. exposes attachment state through the shared paperclip action across stage views
3. persists attachment data through the normal order save path
4. blocks Orders-to-Main commit when selected rows do not have any attachment

The system is intentionally row-scoped. It is not a standalone document-management module.

## Authoritative Source Files

These files define the current behavior:

- `src/lib/attachment.ts`
- `src/components/shared/EditAttachmentModal.tsx`
- `src/components/shared/RowModals.tsx`
- `src/components/grid/renderers/ActionCellRenderer.tsx`
- `src/hooks/useRowModals.ts`
- `src/hooks/queries/useSaveOrderMutation.ts`
- `src/app/(app)/orders/useOrdersPageHandlers.ts`
- `src/app/(app)/orders/page.tsx`
- `src/services/orderService.ts`
- `src/schemas/order.schema.ts`
- `src/lib/env.ts`
- `src/test/attachment.test.ts`
- `src/test/useRowModals.test.ts`
- `src/test/orderService.test.ts`

## Attachment Data Contract

At the UI level, attachments are represented on `PendingRow` with three fields:

```typescript
{
  attachmentLink?: string;
  attachmentFilePath?: string;
  hasAttachment?: boolean;
}
```

Current meaning:

- `attachmentLink` stores an external URL or a local file path string
- `attachmentFilePath` stores the Supabase Storage object path
- `hasAttachment` is derived state, not an independent source of truth

The current helper contract is:

- a row counts as attached if `attachmentLink` is non-empty after trimming, or `attachmentFilePath` is non-empty after trimming
- if both are empty, the row is considered unattached

## Where Attachment UI Appears

The paperclip action is rendered by `ActionCellRenderer`.

Current UI behavior:

- the icon is indigo when `row.hasAttachment` is truthy
- the icon is gray when the row has no attachment
- clicking the icon opens the shared attachment modal through `useRowModals`

The shared row modal path is used from:

- Orders
- Main Sheet
- Call List
- Booking
- Archive
- Search Results

Orders also have a separate bulk attachment modal opened from the toolbar.

## Accepted Inputs

### External link or path

The external link field accepts plain strings. In practice that includes:

- HTTP, HTTPS, and FTP URLs
- local Windows-style paths
- any other path-like string the user wants to keep as a reference

`sanitizeAttachmentLink()` currently does two things:

- trims leading and trailing whitespace
- strips one pair of wrapping double quotes

Important consequence:

- the system does not validate that the string is reachable
- the system stores the sanitized text as-is

### Uploaded files

The upload path currently accepts only:

- `.jpg`
- `.jpeg`
- `.png`
- `.pdf`

Current upload limits:

- maximum size is 5 MB
- unsupported MIME types are rejected
- oversize files are rejected

Storage object paths are built as:

```text
orders/{orderId}/{sanitizedFilename}
```

Filename sanitization replaces characters outside `[a-zA-Z0-9._-]` with `_`.

## Modal Behavior

`EditAttachmentModal` is the single-row attachment UI.

When the modal opens, it resets to the current row state:

- existing external link
- existing stored file path
- no newly selected file
- no pending delete confirmation

Current modal capabilities:

- upload a new supported file
- drag and drop a file
- keep or edit an external link/path
- copy the current external link/path
- open the currently stored uploaded file
- mark the current stored file for deletion
- clear the external link through explicit confirmation

Two important UX rules are intentional:

1. an existing external link cannot be cleared by typing backspace/delete to an empty string; clearing must go through the trash action and confirmation dialog
2. deleting a file or link in the modal is not immediate; the change is only persisted after `Save Changes`

Another important detail:

- selecting a new file marks the previous stored file for removal after a successful save

## Single-Row Save Flow

The single-row save path is:

1. user opens the paperclip modal from a row
2. `useRowModals.saveAttachment()` sends `attachmentLink`, `attachmentFilePath`, and recomputed `hasAttachment`
3. the row update is routed through the normal stage-aware `onUpdate` path
4. `useSaveOrderMutation()` applies an optimistic update in the matching stage cache
5. `orderService.saveOrder()` persists the change
6. on success, the modal closes and a success toast is shown

Stage routing matters. Tests already verify that attachment saves carry the correct source tag when one is provided.

## Orders Bulk Attachment Behavior

Orders page exposes a bulk attachment modal from the toolbar, but it is intentionally more limited than the row modal.

Current bulk behavior:

- uses the same `EditAttachmentModal` component
- passes `allowUpload={false}`
- disables file upload and drag/drop
- only updates `attachmentLink`
- preserves each row's existing `attachmentFilePath`
- recomputes `hasAttachment` from the new link plus the row's existing stored file path

Current consequence:

- bulk attach can add, replace, or clear links for many rows
- bulk attach cannot upload files for many rows
- bulk clearing the link does not remove an already uploaded file path on those rows

## Persistence Model

The primary persistence model uses dedicated `orders` table columns:

- `attachment_link`
- `attachment_file_path`

Current save behavior in `orderService.saveOrder()`:

1. `hasAttachment` is removed from metadata and never treated as authoritative persisted state
2. `attachmentLink` and `attachmentFilePath` are written to dedicated columns when those columns exist
3. those same fields are removed from the normal metadata payload in the primary path

### Legacy compatibility fallback

The service intentionally supports older schemas where attachment columns do not exist yet.

Fallback behavior:

- if Supabase reports missing attachment columns from schema cache
- reads fall back to a select without attachment columns
- writes fall back to storing `attachmentLink` and `attachmentFilePath` inside `metadata`

Current read precedence in `mapSupabaseOrder()`:

- prefer dedicated columns when present and non-empty
- otherwise use the metadata fallback values
- always recompute `hasAttachment` from the final merged values

This compatibility path is already covered by tests and should not be removed casually.

## Storage Behavior

Uploaded files use Supabase Storage from the browser client.

Current bucket behavior:

- bucket name comes from `NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET`
- default bucket name is `attachments`

Current upload behavior:

- upload uses `upsert: true`
- content type is sent from the selected file MIME type
- upload requires an existing `orderId`

Current file access behavior:

- existing uploaded files are opened with `storage.from(bucket).getPublicUrl(path)`

Important consequence:

- the current implementation assumes attachment files are accessible through public URLs
- it does not generate signed URLs

## File Replacement and Cleanup Semantics

The modal has explicit cleanup logic around uploads.

Current behavior:

- if a new file uploads successfully but the subsequent row save fails, the newly uploaded file is deleted on a best-effort basis
- if save succeeds and the row replaced or removed a previous file, the old file is deleted on a best-effort basis
- if old-file deletion fails after a successful save, the save still stands and the error is only logged

This means data persistence is prioritized over storage cleanup when those goals conflict.

## Workflow Rules That Depend on Attachments

The strongest workflow dependency currently lives in Orders commit.

When committing selected Orders rows to Main:

- each selected row must pass strict validation
- each selected row must have part number and description
- each selected row must satisfy `hasAttachment(row)`

If any selected row has neither `attachmentLink` nor `attachmentFilePath`, commit is blocked with an error toast.

Important scope note:

- this attachment gate is currently enforced on Orders `handleCommit()`
- other stage transitions do not enforce the same attachment requirement here

## Current Invariants

These behaviors are intentional and should not be changed casually:

1. Attachment presence is defined by link-or-file existence, not by `hasAttachment` alone.
2. Single-row attachment edits go through the standard row update path, not a separate attachment API.
3. Bulk attachment editing in Orders is link-only.
4. Dedicated attachment columns are preferred, but metadata fallback remains supported.
5. Replacing an uploaded file attempts to clean up the previous stored object after a successful save.
6. External links are sanitized, not validated.
7. The paperclip icon reflects attachment presence, not attachment type or accessibility.

## Practical Limitations

Current limitations worth knowing before changing the system:

- No bulk file upload flow.
- No validation that external links or local paths actually exist.
- File open uses a public URL, not a signed URL.
- Clearing or deleting inside the modal is only committed on save.
- Deleting an order row does not currently delete any stored attachment file from Supabase Storage.
- `detectAttachmentKind()` exists as a helper and test target, but is not currently driving modal behavior.

## Recommended Test Targets After Changes

At minimum, cover:

- single-row save with external link only
- single-row save with uploaded file only
- replace uploaded file and verify old-file cleanup behavior
- save failure after upload and orphan cleanup attempt
- bulk link update in Orders
- bulk link clear while preserving existing uploaded file paths
- Orders commit blocking when attachment is missing
- legacy fallback behavior when attachment columns are unavailable

## Summary

The current attachment system is a row-scoped feature layered onto the normal order save flow. It supports one external link/path and one stored file path per row, exposes attachment state through the shared paperclip UI, persists primarily to dedicated order columns with a metadata fallback, and uses the Orders commit gate to enforce attachment presence before promotion to Main.
