# Plan — Prevent architecture-audit regressions

## Context

`architecture-audit.md` flagged 18 Clean-Architecture findings (6 High, 7 Medium, 5 Low). All have been resolved across multiple refactor branches. The user now wants **durable guardrails** so the same violations don't re-enter the codebase whenever new features, bug fixes, or edits are made — and the existing project docs aligned to reflect the new standards.

Two existing rule files will be updated, **one new canonical rules file** will be created, **Biome `noRestrictedImports`** will be extended so dependency-direction violations fail lint, and **the Obsidian-vault docs** (`docs/architecture.md`, relevant `docs/features/*`) will be updated to mirror the new standards so the `pendingsystem-vault` skill surfaces them.

The deliverable is a tight, layered set of rules:

- **`.claude/rules/architecture.md`** (new) — full layer map, dependency-direction matrix, anti-pattern catalog. Single source of truth.
- **`CLAUDE.md`** — short "Architecture Standards" section that points to the new file and codifies the highest-leverage rules inline.
- **`.claude/rules/Claude Code Rules.md`** — AI-behavior rules for handling new features, bugs, and edits.
- **`biome.json`** — `noRestrictedImports` extended to enforce dependency direction at lint time.
- **`docs/architecture.md`** + relevant **`docs/features/*.md`** — aligned with the new standards so the vault skill surfaces accurate context on every architectural decision.

A final "Claude Code Capabilities" section lists optional automations the user can adopt later (PostToolUse hooks, slash command, subagent).

---

## Files to modify

| Path | Action | Why |
|---|---|---|
| `.claude/rules/architecture.md` | **Create** | Canonical layer map, dependency matrix, anti-pattern list, required patterns |
| `CLAUDE.md` | **Edit** — add "Architecture Standards" section near top + "Anti-Patterns (forbidden)" list | Highest-leverage rules surfaced inline; pointer to detail file |
| `.claude/rules/Claude Code Rules.md` | **Edit** — extend with "When creating features, fixing bugs, or editing existing code" rules | AI-behavior guardrails per the user's request |
| `biome.json` | **Edit** — extend `noRestrictedImports` block | Hard enforcement of dependency direction |
| `docs/architecture.md` | **Edit** (Obsidian vault) | Mirror the layer map + dependency matrix so `pendingsystem-vault` skill surfaces it on architectural decisions |
| `docs/features/*.md` (touched ones only) | **Edit** (Obsidian vault) | Update any feature doc that references the legacy anti-patterns the audit removed (e.g., `draft-session.md` if it mentions store-owned stage data, `mobile-order.md` if it describes business logic in the route handler) |

---

## 1. `.claude/rules/architecture.md` (new file)

Structure (concise reference, not prose):

### a. Layer map (matches current `src/`)

```
domain/      pure business logic; no React, no Supabase, no localStorage, no env
schemas/     Zod parsing/validation at boundaries; persistence schema separate from domain
services/    thin repository + mapper + use-case orchestration
lib/         framework utilities (logger, env, queryClient, supabase clients, helpers)
store/       UI-local + draft-session state ONLY; NOT operational stage data
hooks/       React orchestration; wraps services via React Query
components/  presentation; data only via hooks
app/         Next.js routes; ≤50 LOC handlers, delegate to services
```

### b. Dependency direction matrix (who can import whom)

| Layer | May import | Must NOT import |
|---|---|---|
| `domain/` | `types/` only | `lib`, `services`, `store`, `hooks`, `components`, `app`, `schemas` |
| `schemas/` | `domain`, `types` | `lib`, `services`, `store`, `hooks`, `components`, `app` |
| `services/` | `domain`, `schemas`, `lib`, `types` | `store`, `hooks`, `components`, `app` |
| `lib/` | `domain`, `schemas`, `types` | `services`, `store`, `hooks`, `components`, `app` |
| `store/` | `domain`, `schemas`, `lib`, `types` (+ types-only from `services`) | `components`, `app`, `hooks` (runtime), `lib/queryClient` runtime client |
| `hooks/` | everything above | `components`, `app` |
| `components/` | `hooks`, `lib`, `schemas`, `domain`, `types` | direct `services/*` runtime calls (must go via hooks) |
| `app/` | everything | — |

### c. Anti-pattern catalog (linked to original audit IDs)

Each entry: 1-line forbidden pattern + 1-line "do instead" + audit ID.

- ❌ Zustand slice imports `queryClient` (H1) → inject `getStageRows`/`invalidateStage` via adapter
- ❌ Operational stage rows stored in Zustand (H6) → React Query is sole owner of stage data
- ❌ Schema doubles as domain entity (H2) → keep `PendingRowBaseObject` (boundary) separate from any domain type
- ❌ Persistence-only columns leak into base schema (M5) → put them only on `PersistedOrderRowSchema`
- ❌ Inline `createServiceClient` in API route (H3) → import from `@/lib/supabase-admin`
- ❌ Service file >500 LOC mixing repo+mapper+use-case (H4) → split into `*Repository`, `*Mapper`, `*UseCases`
- ❌ Stage transitions composed inline in `page.tsx` / page-handler hooks (H5) → use `@/lib/orderStageTransitions`
- ❌ `console.log/warn/error/debug` in `src/` (L4) → `import { logger } from '@/lib/logger'`
- ❌ Silent `null` returns on validation failure (M4) → throw typed error (e.g., `OrderMappingError`)
- ❌ Per-endpoint snake_case→camelCase mappers (M2) → use `mapKeysToCamel<T>` from `@/lib/utils`
- ❌ Business logic in API route handlers (M6) → keep handler ≤50 LOC; delegate to service
- ❌ Components calling `orderService.*` directly (M3) → wrap as a React Query hook
- ❌ New top-level singleton client without a factory (M7) → expose a factory + interface
- ❌ `stage: z.string()` instead of `OrderStage` enum (L5) → use `z.enum(["orders","main","call","booking","archive"])`
- ❌ Back-compat re-exports added when not strictly required (L2) → update call sites instead
- ❌ Mutations bypassing existing optimistic hooks (`useSaveOrderMutation`, `useBulkUpdateOrderStageMutation`, `useBulkDeleteOrdersMutation`)

### d. Required patterns for new code

- New persistence shape → boundary schema in `schemas/`, optional domain helper in `domain/`, mapper in `services/orderMapper.ts` or sibling, then a React Query hook
- New stage mutation → optimistic pattern via existing mutation hook; never raw `queryClient.setQueryData` from a page
- New API route → handler ≤50 LOC: `parse → authorize → service.call() → respond`
- New cross-cutting client → factory in `lib/`, no second copy
- New domain rule → put in `domain/` with a unit test; no React or Supabase imports
- New stage transition → factor command-builders into `@/lib/orderStageTransitions`
- New mapping at a snake/camel boundary → `mapKeysToCamel`

### e. Soft size budgets (warning thresholds)

- Service files: ≤400 LOC (split at 500)
- Page handler hooks (`use*PageHandlers.ts`): ≤300 LOC; extract use-cases to `lib/` or `services/`
- API route files: ≤50 LOC

---

## 2. `CLAUDE.md` — additions

Insert a new top-level section **"Architecture Standards"** immediately after the existing **"Refactor Safety Rules"** section (the Refactor Safety Rules already use the "RESTRICTED RULE" idiom, so the two stand together):

```
## Architecture Standards

> **RESTRICTED RULE — must not be broken.** Full reference: `.claude/rules/architecture.md`.

### Dependency direction (one line per layer)
- `domain/` → only `types/`. Pure; no React/Supabase/env/localStorage.
- `schemas/` → `domain`, `types`. No `lib`/`services`/`store`/UI.
- `services/` → `domain`, `schemas`, `lib`, `types`. No store/components/hooks.
- `lib/` → `domain`, `schemas`, `types`. No `services`/`store`/UI.
- `store/` → upward layers + types-only from services. No `lib/queryClient` runtime client; no React Query cache access from slices.
- `hooks/` → everything above. No components/app.
- `components/` → only via `hooks/`; no direct `services/*` runtime calls.
- `app/` → routes only; handlers ≤50 LOC, delegate to services.

### Top forbidden patterns (catalog: `.claude/rules/architecture.md` §c)
- No `console.*` in `src/` — use `@/lib/logger`.
- No inline `createServiceClient` in API routes — use `@/lib/supabase-admin`.
- No `queryClient` import in `store/slices/`.
- No operational stage rows in Zustand — React Query owns them.
- No `null` returns on validation failure — throw a typed error.
- No business logic in API route handlers, page-handler hooks, or schemas.
- No new service file > 500 LOC; split into repo/mapper/use-case.
- No back-compat re-exports; update call sites.

### Required patterns for new work
- Stage transitions → `@/lib/orderStageTransitions` command builders.
- Mutations → existing optimistic hooks (`useSaveOrderMutation`, `useBulk*`).
- Snake/camel mapping → `mapKeysToCamel<T>` from `@/lib/utils`.
- Stage enum → `z.enum(["orders","main","call","booking","archive"])`.
- New API route → `parse → authorize → service.call() → respond`, ≤50 LOC.

If a planned change would break any of the above, **stop and warn** using the same RESTRICTED RULE format as the Refactor Safety Rules.
```

No other CLAUDE.md sections change.

---

## 3. `.claude/rules/Claude Code Rules.md` — additions

Append a new section after the existing rules:

```
### architecture rules for new features, bugs, and edits

Before writing any code:
1. Identify which layer (domain/schemas/services/lib/store/hooks/components/app) the change belongs in.
2. Check the dependency-direction matrix in `.claude/rules/architecture.md` §b. If your planned change would violate it, stop and propose a redesign before editing.
3. Search for an existing utility, hook, service method, or command builder before creating a new one. Reuse beats duplication (recent audit removed four duplicate `createServiceClient` factories and per-route mappers).
4. Read `.claude/rules/architecture.md` §c (anti-pattern catalog) and confirm your change does not reintroduce any of those patterns.

While editing:
- New logging → `import { logger } from "@/lib/logger"`. Never `console.*` in `src/`.
- New Supabase admin client → import from `@/lib/supabase-admin`. Do not declare a local factory.
- New stage mutation in a page → use existing optimistic mutation hooks; do not call `queryClient.setQueryData` directly.
- New stage transition logic → add a command builder in `@/lib/orderStageTransitions`, not inline in `page.tsx`.
- New snake/camel boundary → reuse `mapKeysToCamel<T>` from `@/lib/utils`.
- New `OrderStage` literal → use the existing `z.enum([...])`; never widen back to `z.string()`.
- New validation failure → throw a typed error (e.g., `OrderMappingError`); never return `null`.

When fixing bugs:
- First confirm the bug is real in the current code (per existing workflow convention). Then identify which layer owns the bug. Fix at the lowest layer that owns the invariant — do not patch symptoms in `components/` if the root cause is in `services/` or `domain/`.

When editing existing features:
- Do not enlarge a file past its layer budget (service ≤400 LOC, page-handler hook ≤300 LOC, API route ≤50 LOC). If you are about to cross that, split first.
- Do not introduce new singletons without a factory + interface (M7 in the audit).
- If your edit touches a schema and a persistence row, check that `PendingRowBaseObject` (boundary) and any persistence-only schema stay separated (H2/M5).

Required diligence after any architectural-shape change:
- Run `npm run type-check` and `npm run lint` on the changed files (already required by existing rules).
- Mentally re-walk the dependency direction matrix for every import you added.
- If the change spans 3+ files or 2+ layers, propose a brief plan before applying it.

Warn-before-proceed (RESTRICTED):
- Any change that would (a) violate dependency direction, (b) reintroduce a catalogued anti-pattern, or (c) push a file past its size budget triggers a mandatory warning, identical in tone to the existing Refactor Safety Rules warning. Confirm with the user before proceeding.
```

---

## 4. `biome.json` — `noRestrictedImports` extension

Extend the existing `noRestrictedImports` rule. New restrictions (paths use `@/` alias as in the project):

- In `src/domain/**` → forbid `@/lib/*`, `@/services/*`, `@/store/*`, `@/hooks/*`, `@/components/*`, `@/app/*`
- In `src/schemas/**` → forbid `@/lib/*`, `@/services/*`, `@/store/*`, `@/hooks/*`, `@/components/*`, `@/app/*` (allow `@/domain/*`, `@/types`)
- In `src/lib/**` → forbid `@/services/*`, `@/store/*`, `@/hooks/*`, `@/components/*`, `@/app/*`
- In `src/services/**` → forbid `@/store/*`, `@/hooks/*`, `@/components/*`, `@/app/*`
- In `src/store/**` → forbid `@/lib/queryClient` (specific path), `@/components/*`, `@/app/*`
- (Existing DataGrid restrictions preserved.)

Biome's `noRestrictedImports` supports path-scoped overrides via the `overrides` array (per-glob rule configuration). The implementation will add one override block per layer with its own `noRestrictedImports` paths list. The audit's two known type-only seams (`lib/orderStageTransitions.ts` importing `PatchRowCommand` type from `@/store/slices`; `services/reports/reportSettingsService.ts` importing `ReportSettings` type from `@/store/types`) will be allowed via `import type` exclusion or explicit `"allowImportNames"` carve-outs — to be confirmed during implementation; if Biome cannot distinguish type-only at the rule level, those two seams will be re-homed into `@/types` instead.

---

## 5. Obsidian-vault docs alignment (`docs/`)

CLAUDE.md (lines 210-237) requires the `pendingsystem-vault` skill to consult `docs/architecture.md` before architectural decisions and `docs/features/*.md` when a feature is named. After the rules above land, those docs must mirror them or the skill will surface stale guidance.

### a. `docs/architecture.md`

Add (or replace existing equivalent sections with) the same canonical content used in `.claude/rules/architecture.md`:

- **Layer map** (one paragraph per layer, with the actual `src/<layer>/` path and a 1-line responsibility).
- **Dependency-direction matrix** (identical table to `.claude/rules/architecture.md` §b).
- **Anti-pattern catalog** (link each entry back to the original audit ID and to the resolving branch listed in `architecture-audit.md`'s Resolution Log, so the vault preserves the historical "why this rule exists" trail).
- **Required patterns for new code** (mirrors `.claude/rules/architecture.md` §d).
- **Size budgets** (services ≤400, page hooks ≤300, API routes ≤50).
- **Cross-link** to `.claude/rules/architecture.md` as the source of truth, noting that this vault page is the human-readable reflection.

This is a vault file (gitignored), so use the `mcp__obsidian__write_note` / `mcp__obsidian__patch_note` tools as required by the `pendingsystem-vault` skill — not direct file writes.

### b. `docs/features/*.md` — targeted patches

Walk each existing feature doc and patch only the ones that reference patterns the audit removed. Expected candidates (verify each exists in the vault before editing — do not invent files):

- **`docs/features/draft-session.md`** — if it mentions Zustand owning stage rows or `queryClient` access from the slice, update to: "draft state is in Zustand; operational stage rows are owned by React Query; the slice receives data via the `ordersQueryAdapter` ports."
- **`docs/features/mobile-order.md`** — if it describes business logic inside the route handler, update to: "the route is ≤50 LOC and delegates to `src/services/mobileOrderService.ts`."
- **`docs/features/auth.md`** — confirm it mentions `@/lib/supabase-admin` as the canonical service-role factory; correct any reference to inline `createServiceClient` declarations.
- **`docs/features/reports.md`** / **`docs/features/booking.md`** / **`docs/features/beast-mode.md`** — scan only for stale anti-pattern references; no change if none found.

Each patch must follow the existing convention in those docs (no UI/structure rewrites; add a "Standards" or "Architecture" subsection if missing, otherwise update the relevant paragraph in place).

### c. `docs/api.md`

If it exists and documents API routes, update the "handler shape" guidance (or add it) to read: `parse → authorize → service.call() → respond`, ≤50 LOC, no inline `createServiceClient`. Reference `@/lib/supabase-admin`.

### d. Skill-driven verification

After the vault edits, ask the `pendingsystem-vault` skill (via `mcp__obsidian__search_notes`) for "dependency direction" and "anti-pattern" — both should return the new pages. This confirms the next AI session will surface the standards on every architectural moment.

---

## 6. Claude Code capabilities to leverage (recommendations)

These are **suggestions** the user can opt into later. None are part of the file edits above.

### a. Extend the existing PostToolUse hook (`.claude/settings.json`)

Today: runs `tsc --noEmit` and `biome check .` after Edit/Write. Add a small Node/PowerShell script invoked from the same hook that:

- Greps the edited file path for `console\.(log|warn|error|debug)` under `src/` and prints a non-blocking warning pointing to `@/lib/logger`.
- If the edited path is under `src/store/slices/` and the diff added `from "@/lib/queryClient"`, warn with an H1-regression message.
- If the file's line count exceeds the layer budget (service ≤400, page hook ≤300, API route ≤50), warn.

Hooks integrate cleanly with the existing settings.json; no infra change beyond an extra `command:` entry.

### b. A custom slash command `/architecture-check` (`.claude/commands/architecture-check.md`)

Short pre-flight command Claude is instructed to run before any feature/bug/edit work. Body would read `.claude/rules/architecture.md`, then walk the user (or main loop) through:

1. Which layer is being touched?
2. Which imports does the change introduce? Validate against the matrix.
3. Does the change reintroduce any catalogued anti-pattern?

Lightweight; no automation cost.

### c. A custom subagent `architecture-guardian` (`.claude/agents/architecture-guardian.md`)

Specialized read-only agent dispatched by the main loop before non-trivial multi-file changes. Its prompt: "Given this diff (or planned edits), verify dependency direction, check for catalogued anti-patterns, and recommend splits if a file would exceed its budget." Returns a pass/fail + bullet list. The main loop only proceeds on pass or a documented override.

### d. Leverage the existing `pendingsystem-vault` skill

CLAUDE.md already requires consulting `docs/architecture.md` (Obsidian vault) before architectural decisions. After this plan lands, also mirror the dependency-direction matrix into `docs/architecture.md` so the vault is current. The skill will then surface it automatically on future architectural-decision moments.

### e. Pre-commit hook (Husky) — optional belt-and-suspenders

The `.husky/pre-commit` already runs Biome. Once `noRestrictedImports` is extended (item 4), the existing hook already catches dependency-direction violations at commit time. No new hook needed.

### f. CodeRabbit `coderabbit:code-review` skill on PRs

Already installed. After this plan, configure CodeRabbit's prompt context to reference `.claude/rules/architecture.md` so review feedback is anchored in the same standards.

---

## Verification

After implementation:

1. `npm run lint` — must pass; any current violations are pre-existing and should be either fixed or documented.
2. `npm run type-check` — must pass.
3. Manually attempt one forbidden import in a scratch file (e.g., a new `src/domain/sentinel.ts` importing `@/services/orderService`) and confirm Biome errors. Then delete the scratch file.
4. Open `CLAUDE.md`, `.claude/rules/Claude Code Rules.md`, and `.claude/rules/architecture.md` and confirm the cross-references resolve (link text matches file names).
5. Optionally: spawn a fresh Claude Code session and ask it to "add a new API route that calls Supabase directly with a service-role client" — confirm the new rules are surfaced and the proposal is corrected to use `@/lib/supabase-admin`.

---

## Critical files referenced (read-only context)

- `architecture-audit.md` — source of all 18 findings
- `.claude/rules/Claude Code Rules.md` — current general rules (extend)
- `CLAUDE.md` — current project doc (extend)
- `biome.json` — current lint config (extend)
- `src/lib/supabase-admin.ts` — canonical admin client (H3 fix)
- `src/lib/logger.ts` — canonical logger (L4 fix)
- `src/lib/orderStageTransitions.ts` — canonical stage-transition builders (H5 fix)
- `src/lib/utils.ts` — `mapKeysToCamel` lives here (M2 fix)
- `src/services/orderMapper.ts` — mapper extracted from orderService (H4 fix)
- `src/store/adapters/ordersQueryAdapter.ts` — adapter inversion (H1 fix)
- `src/schemas/order.schema.ts` — `PendingRowBaseObject` / `PersistedOrderRowSchema` (H2/M5 fix)
