# Comprehensive Codebase Audit Report

Date: 2026-02-25  
Repository: `D:\pendingsystem`

## Scope

This audit covers:

- Architecture and folder structure
- Coding standards and lint health
- TypeScript safety and schema validation
- Performance and rendering/data flow efficiency
- Security posture and trust boundaries
- Accessibility (a11y)
- SEO readiness
- Maintainability and documentation drift
- Testing quality and coverage risk
- Dependency risk
- Deployment readiness

---

## Executive Summary

The codebase has a strong base (modern Next.js stack, React Query, Zustand, Zod, test tooling), but there are **serious production risks** around **security**, **state architecture**, and **data integrity**:

- **Critical security issues**: unauthenticated backup trigger route and exposed secrets in local config artifacts.
- **Critical data integrity issue**: invalid rows can bypass Zod validation and still be treated as typed domain objects.
- **Architecture drift**: server data mirrored into Zustand and React Query simultaneously, causing stale logic and maintenance complexity.
- **Quality gates are not enforced in CI**, and testing coverage misses critical workflow logic.

---

## Prioritized Findings

### Critical

1) **Unauthenticated operational endpoint can trigger backup workflows**  
Severity: `critical`  
Category: Security

Evidence:

- `src/app/api/trigger-backup/route.ts:6`

```ts
export async function POST() {
```

- `src/store/slices/reportSettingsSlice.ts:117`

```ts
const response = await fetch("/api/trigger-backup", { method: "POST" });
```

Impact:

- Any caller able to hit this route can trigger expensive operational jobs repeatedly.
- Potential abuse path for workflow spam/data exfil depending on recipients/settings.

Fix:

- Require authenticated server-side authorization (admin-only).
- Add CSRF/origin checks for browser-triggered POST.
- Add rate-limiting and audit logging.

---

2) **Secrets present in plaintext local artifacts**  
Severity: `critical`  
Category: Security

Evidence:

- `.env.local` contains service-level and operational secrets (e.g. Supabase service role, SMTP, GitHub PAT).
- `.vscode/mcp.json` contains access token material.

Impact:

- Credential leakage can result in full DB compromise, workflow abuse, or account takeover.

Fix:

- Rotate exposed credentials immediately.
- Keep secrets only in managed secret stores/CI variables.
- Enable secret scanning in CI (`gitleaks`/GitHub secret scanning).

---

3) **Zod parse failure still returns `PendingRow` via unsafe cast**  
Severity: `critical`  
Category: Type safety / Data integrity

Evidence:

- `src/services/orderService.ts:265`

```ts
const parseResult = PendingRowSchema.safeParse(resultObj);
```

- `src/services/orderService.ts:282`

```ts
return resultObj as PendingRow;
```

Impact:

- Invalid/malformed external data enters app as trusted domain data.
- Downstream runtime crashes and incorrect business logic become likely.

Fix:

- Never cast failed schema parses to domain types.
- Return `null`/`Result` for invalid entries and filter safely.
- Capture parse failures with structured logging.

---

4) **Dual source-of-truth for server rows (React Query + Zustand mirrors)**  
Severity: `critical`  
Category: Architecture

Evidence:

- `src/app/(app)/orders/useOrdersPageHandlers.ts:22`

```ts
const { data: ordersRowData = [] } = useOrdersQuery("orders");
```

- `src/app/(app)/orders/useOrdersPageHandlers.ts:50`

```ts
setOrdersRowData(ordersRowData);
```

- `src/store/slices/notificationSlice.ts:72`

```ts
const sources = [
  { data: state.rowData, name: "Main Sheet", path: "/main-sheet" },
  { data: state.ordersRowData, name: "Orders", path: "/orders" },
];
```

Impact:

- Stale data risk for notifications/auto-archive/business workflows.
- Extra rerenders/memory and harder debugging.

Fix:

- Use React Query as single source for backend data.
- Keep Zustand for UI-local state only.
- Derive notifications from query cache/selectors.

---

### High

5) **Raw HTML print generation with unescaped user data (XSS vector)**  
Severity: `high`  
Category: Security

Evidence:

- `src/lib/printing/orderDocument.ts:337`

```ts
printWindow.document.write(htmlContent);
```

Impact:

- Stored malicious values can execute in generated print windows.

Fix:

- Escape interpolated values (`& < > " '`).
- Prefer DOM APIs + `textContent` over string HTML assembly.

---

6) **Store slice performs direct backend I/O (boundary violation)**  
Severity: `high`  
Category: Architecture / Maintainability

Evidence:

- `src/store/slices/reportSettingsSlice.ts:3`

```ts
import { supabase } from "@/lib/supabase";
```

- `src/store/slices/reportSettingsSlice.ts:26`

```ts
const { data, error } = await supabase.from("report_settings").select("*");
```

Impact:

- Bypasses React Query/service-layer conventions and invalidation discipline.

Fix:

- Move Supabase access into `src/services/*` + React Query hooks.
- Keep slices pure and UI-oriented.

---

7) **Mutation invalidation strategy causes stale tabs and refetch storms**  
Severity: `high`  
Category: Performance / Correctness

Evidence:

- `src/hooks/queries/useOrdersQuery.ts:150`

```ts
queryClient.invalidateQueries({ queryKey: ["orders", variables.stage] });
```

- `src/app/(app)/call-list/page.tsx:440`

```ts
for (const row of selectedRows) {
  await deleteOrderMutation.mutateAsync(row.id);
}
```

Impact:

- Source stage can remain stale.
- N selected rows cause N sequential mutations and repeated invalidations.

Fix:

- Introduce bulk mutations.
- Invalidate both source and destination stage caches.
- Use atomic optimistic cache updates.

---

8) **Search debounce effectively bypassed**  
Severity: `high`  
Category: Performance / UX

Evidence:

- `src/components/shared/Header.tsx:131`

```tsx
value={useAppStore((state) => state.searchTerm)}
onChange={(e) => useAppStore.getState().setSearchTerm(e.target.value)}
```

Impact:

- Every keystroke updates global store immediately.
- Expensive search recomputation and rerenders.

Fix:

- Bind input to local state.
- Apply debounced write (>=300ms) to global store.

---

9) **A11y: icon-only controls lack explicit labels and custom div controls break keyboard semantics**  
Severity: `high`  
Category: Accessibility

Evidence:

- `src/components/orders/OrdersToolbar.tsx:123`

```tsx
<Button size="icon" ...>
  <Tag className="h-3.5 w-3.5" />
</Button>
```

- `src/components/reports/FrequencyPicker.tsx:115`

```tsx
<motion.div onClick={() => { setOption(op); ... }} className="... cursor-pointer">
```

Impact:

- Screen-reader ambiguity and keyboard-inaccessible interactions.

Fix:

- Add `aria-label` to icon-only buttons.
- Use semantic `<button>` for interactive options.

---

10) **Dependency vulnerabilities in production**  
Severity: `high`  
Category: Dependencies/Security

Evidence:

- `package.json:54`

```json
"next": "^15.5.9"
```

- `package.json:55`

```json
"nodemailer": "^6.10.0"
```

Impact:

- Known advisories affect runtime attack surface.

Fix:

- Upgrade `next` to patched 15.5.12+.
- Upgrade/migrate `nodemailer` to safe supported range and retest email workflows.

---

### Medium

11) **Large component/page files reduce maintainability**  
Severity: `medium`  
Category: Maintainability

Evidence:

- `src/components/orders/OrderFormModal.tsx` (~1267 LOC)
- `src/app/(app)/booking/page.tsx` (~469 LOC)
- `src/app/(app)/call-list/page.tsx` (~453 LOC)

Impact:

- High cognitive load and regression risk.

Fix:

- Split into container/hooks/presentational components by responsibility.

---

12) **Whole-store subscriptions cause avoidable rerenders**  
Severity: `medium`  
Category: Performance / Architecture

Evidence:

- `src/components/shared/CloudSync.tsx:15`

```ts
const store = useAppStore();
```

Impact:

- Component rerenders on unrelated state changes.

Fix:

- Use selector-based subscriptions (`useAppStore((s) => s.someField)`).

---

13) **SEO baseline incomplete (canonical/robots/sitemap/per-route metadata)**  
Severity: `medium`  
Category: SEO

Evidence:

- `src/app/layout.tsx:14`

```ts
export const metadata: Metadata = { title: "...", description: "..." };
```

- Missing: `src/app/robots.ts`, `src/app/sitemap.ts`

Impact:

- Weak crawl/index control and duplicate metadata across routes.

Fix:

- Add canonical strategy, route metadata, robots, sitemap, and heading hierarchy.

---

14) **Test coverage misses core business flows; E2E absent**  
Severity: `medium`  
Category: Testing

Evidence:

- `playwright.config.ts:13` expects `./tests`, but no `tests/**/*.e2e.spec.ts` found.
- Critical modules lacking focused tests: `src/hooks/queries/useOrdersQuery.ts`, multiple store slices, workflow handlers.

Impact:

- High regression risk in production workflows.

Fix:

- Add Playwright smoke tests for core paths.
- Add branch/edge-case tests for query mutations and stage transitions.

---

15) **Docs drift from runtime behavior**  
Severity: `medium`  
Category: Maintainability/Documentation

Evidence:

- `FEATURES.md:117` describes archive as read-only.
- `src/app/(app)/archive/page.tsx` includes reorder/delete operations.

Impact:

- Product/QA expectations mismatch; operational confusion.

Fix:

- Update docs in same PR as behavior changes (or enforce intended behavior in code).

---

### Low

16) **Lint and style baseline is noisy**  
Severity: `low`  
Category: Coding standards

Evidence:

- Audit run reported large lint warning/error count (95 errors / 191 warnings).

Impact:

- Reduces trust in lint as a signal and hides real regressions.

Fix:

- Run `npm run lint:fix`, then address remaining diagnostics and enforce clean lint in CI.

---

## Anti-patterns Observed

- UI/store layers handling business orchestration and backend writes directly.
- Duplicated workflow logic across stage pages.
- Per-row sequential mutation loops for batch actions.
- Mixed data ownership between React Query and Zustand.
- Unsafe `any`/assertions in critical paths.

---

## Quick Wins (1-3 days)

1. Lock down `/api/trigger-backup` with authz + rate limiting.
2. Rotate exposed secrets and add secret scanning.
3. Patch vulnerable deps (`next`, `nodemailer`) and rerun audit.
4. Remove unsafe `as PendingRow` fallback after failed parse.
5. Restore true debounced search input behavior.
6. Add `aria-label` to icon-only controls and fix keyboard semantics in `FrequencyPicker`.
7. Replace full-store Zustand subscriptions with selectors in frequently rendered components.
8. Add `robots.ts` and `sitemap.ts` plus canonical metadata.

---

## Long-term Refactors (1-3 sprints)

1. Establish strict data-layer contract: React Query for server state, Zustand for UI-only state.
2. Extract shared stage workflow engine/hooks (move/reorder/archive rules) used by all stage pages.
3. Break up large page/components into composable units with clear boundaries.
4. Centralize runtime env validation via schema and remove hardcoded operational defaults.
5. Add robust CI pipelines and required checks for lint/type/test/build.
6. Build test matrix: service branch coverage + mutation rollback + end-to-end smoke flows.

---

## Ongoing Quality Checklist

- [ ] PR CI must pass: `lint`, `type-check`, `test`, `build`
- [ ] No new runtime `any`; schema-validate all external payloads
- [ ] No sensitive client-side direct writes without server authz/RLS guarantees
- [ ] React Query remains server data source of truth
- [ ] Batch APIs for multi-row operations
- [ ] Icon-only buttons have accessible names; interactive controls are keyboard operable
- [ ] Route metadata/canonical/robots/sitemap remain up to date
- [ ] Monthly dependency audit and patch cadence
- [ ] Secret scanning enabled and monitored
- [ ] `FEATURES.md` and `ENGINEERING.md` updated with behavior changes

---

## Notes

- This report is based on static inspection and command-assisted auditing; no production traffic replay or penetration testing was performed.
- Recommended next step: execute P0 fixes (security + data integrity) before feature work.
