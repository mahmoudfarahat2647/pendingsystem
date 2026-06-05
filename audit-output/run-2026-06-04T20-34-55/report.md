# Audit Report — pendingsystem

**Score:** 0 / 100
**Project:** D:\pendingsystem
**Timestamp:** 2026-06-04T20:39:32.883Z

| Severity | Count |
|----------|-------|
| CRITICAL | 88 |
| WARNING  | 1190 |
| INFO     | 100 |

## Agents

# Security

## 🟡 WARNING — Unvalidated environment variable
**File:** `next.config.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\components\providers\QueryProvider.tsx:18`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\next.config.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\components\providers\QueryProvider.tsx:17`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\next.config.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\components\providers\QueryProvider.tsx:17`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\next.config.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac607731a8424eb22\vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac607731a8424eb22\vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\components\providers\QueryProvider.tsx:17`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\next.config.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\components\providers\QueryProvider.tsx:17`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\next.config.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\vitest.config.ts:23`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\vitest.config.ts:24`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\middleware.ts:69`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:4`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:8`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:9`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:10`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:10`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🔴 CRITICAL — Hardcoded secret detected
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:11`
**Issue:** A credential appears to be assigned a literal string value.
**Fix:** Move to an environment variable and read via process.env.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:11`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\setup.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\storageStatsRoute.test.ts:65`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\storageStatsRoute.test.ts:66`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:21`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\supabase.test.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:41`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:42`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:152`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:153`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:209`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\test\api\mobile-order.route.test.ts:210`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\auth.ts:14`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\auth.ts:15`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:5`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:25`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:26`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:27`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:28`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:30`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:31`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:32`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:33`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:34`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:35`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:37`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:38`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\env.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\postgres.ts:22`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\postgres.ts:36`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\postgres.ts:39`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\postgres.ts:40`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\resend.ts:7`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\supabase-admin.ts:12`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\lib\supabase-admin.ts:13`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\components\shared\SettingsModal.tsx:56`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\components\providers\QueryProvider.tsx:17`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\trigger-backup\route.ts:16`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Unvalidated environment variable
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\password-reset\request\route.ts:79`
**Issue:** process.env value used without a fallback or validation.
**Fix:** Validate presence (e.g. with zod/envalid) or provide a default.

---

## 🟡 WARNING — Vulnerable dependency: better-auth
**Issue:** npm audit reports a moderate severity advisory for better-auth.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🔴 CRITICAL — Vulnerable dependency: kysely
**Issue:** npm audit reports a high severity advisory for kysely.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🔴 CRITICAL — Vulnerable dependency: next
**Issue:** npm audit reports a high severity advisory for next.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🟡 WARNING — Vulnerable dependency: postcss
**Issue:** npm audit reports a moderate severity advisory for postcss.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🟡 WARNING — Vulnerable dependency: resend
**Issue:** npm audit reports a moderate severity advisory for resend.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🟡 WARNING — Vulnerable dependency: svix
**Issue:** npm audit reports a moderate severity advisory for svix.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🟡 WARNING — Vulnerable dependency: uuid
**Issue:** npm audit reports a moderate severity advisory for uuid.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🔴 CRITICAL — Vulnerable dependency: vitest
**Issue:** npm audit reports a critical severity advisory for vitest.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🟡 WARNING — Vulnerable dependency: ws
**Issue:** npm audit reports a moderate severity advisory for ws.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

## 🔴 CRITICAL — Vulnerable dependency: xlsx
**Issue:** npm audit reports a high severity advisory for xlsx.
**Fix:** Run `npm audit fix` or upgrade the affected package.

---

# Architecture

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/bookingSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/gridSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/inventorySlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/notificationSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/ordersSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/reportSettingsSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/uiSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/useStore.ts → .claude/worktrees/agent-a0c4648e992e57f10/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/bookingSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/gridSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/inventorySlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/notificationSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/ordersSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/reportSettingsSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/uiSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/useStore.ts → .claude/worktrees/agent-abf5f333f245f0f11/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/bookingSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/gridSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/inventorySlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/notificationSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/ordersSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/reportSettingsSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/uiSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/useStore.ts → .claude/worktrees/agent-ac607731a8424eb22/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/bookingSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/gridSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/inventorySlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/notificationSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/ordersSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/reportSettingsSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/uiSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/useStore.ts → .claude/worktrees/agent-ac61263a9aba2ef44/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/bookingSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/gridSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/inventorySlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/notificationSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/ordersSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/reportSettingsSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/uiSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/slices/draftSessionSlice.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/useStore.ts → .claude/worktrees/agent-af46d05b3bad2740b/src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/slices/bookingSlice.ts → src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/bookingSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/draftSessionSlice.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/gridSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/inventorySlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/notificationSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/ordersSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/reportSettingsSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/slices/uiSlice.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🔴 CRITICAL — Circular dependency
**Issue:** Import cycle: src/store/types.ts → src/store/slices/draftSessionSlice.ts → src/store/useStore.ts → src/store/types.ts
**Fix:** Break the cycle by extracting shared code into a third module.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\lib\utils.ts`
**Issue:** File has 11 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\services\orderService.ts`
**Issue:** File has 608 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\store\types.ts`
**Issue:** File has 16 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\draftSessionSlice.test.ts`
**Issue:** File has 649 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\notificationSlice.test.ts`
**Issue:** File has 484 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\orderService.test.ts`
**Issue:** File has 521 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\orderWorkflow.test.ts`
**Issue:** File has 841 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\quickTemplatesRoute.test.ts`
**Issue:** File has 303 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\reservationLabels.test.ts`
**Issue:** File has 317 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\SearchResultsView.test.tsx`
**Issue:** File has 1869 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\mobile-order\page.tsx`
**Issue:** File has 319 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\grid\DataGrid.tsx`
**Issue:** File has 416 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\main-sheet\MainSheetToolbar.tsx`
**Issue:** File has 398 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\orders\OrdersToolbar.tsx`
**Issue:** File has 419 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\reports\LostSalesReportView.tsx`
**Issue:** File has 432 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\shared\EditAttachmentModal.tsx`
**Issue:** File has 488 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\shared\GridConfig.tsx`
**Issue:** File has 531 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\shared\Header.tsx`
**Issue:** File has 407 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\components\shared\Header.tsx`
**Issue:** File has 17 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\shared\Sidebar.tsx`
**Issue:** File has 371 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\testing\DraftSessionRecoveryHarness.tsx`
**Issue:** File has 487 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\ui\bar-chart.tsx`
**Issue:** File has 1669 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\components\ui\bar-chart.tsx`
**Issue:** File has 30 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\ui\chart.tsx`
**Issue:** File has 371 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\ui\combobox.tsx`
**Issue:** File has 580 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\components\ui\combobox.tsx`
**Issue:** File has 23 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\domain\order\orderWorkflow.ts`
**Issue:** File has 387 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\domain\order\orderWorkflow.ts`
**Issue:** File has 20 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\lib\printing\orderDocument.ts`
**Issue:** File has 369 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\lib\printing\reservationLabels.ts`
**Issue:** File has 324 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\lib\reports\reportHtml.ts`
**Issue:** File has 309 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\lib\reports\reportPptx.ts`
**Issue:** File has 402 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\store\slices\draftSessionSlice.ts`
**Issue:** File has 668 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too many exports)
**File:** `src\store\slices\draftSessionSlice.ts`
**Issue:** File has 12 exports (>10).
**Fix:** Group related exports into separate modules.

---

## 🟡 WARNING — God file (too long)
**File:** `src\store\slices\notificationSlice.ts`
**Issue:** File has 391 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\test\reports\lostSalesAnalysis.test.ts`
**Issue:** File has 422 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\archive\page.tsx`
**Issue:** File has 486 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\archive\page.tsx`
**Issue:** File has 31 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\booking\page.tsx`
**Issue:** File has 559 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\booking\page.tsx`
**Issue:** File has 32 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\call-list\page.tsx`
**Issue:** File has 549 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\call-list\page.tsx`
**Issue:** File has 33 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\dashboard\page.tsx`
**Issue:** File has 402 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\main-sheet\page.tsx`
**Issue:** File has 514 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\main-sheet\page.tsx`
**Issue:** File has 26 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\orders\page.tsx`
**Issue:** File has 309 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\orders\page.tsx`
**Issue:** File has 16 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts`
**Issue:** File has 525 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts`
**Issue:** File has 17 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\orders\form\IdentityFields.tsx`
**Issue:** File has 477 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\orders\form\PartsSection.tsx`
**Issue:** File has 400 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts`
**Issue:** File has 730 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

## 🟡 WARNING — High coupling
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts`
**Issue:** File has 19 import declarations (>15).
**Fix:** Reduce dependencies; consider a facade or dependency injection.

---

## 🟡 WARNING — God file (too long)
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderValidation.ts`
**Issue:** File has 350 lines (>300).
**Fix:** Split into focused modules by responsibility.

---

# Type Safety

## 🟡 WARNING — Missing return type annotation
**File:** `src\middleware.ts:33`
**Issue:** Exported function "middleware" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\global-error.tsx:7`
**Issue:** Exported function "GlobalError" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\layout.tsx:40`
**Issue:** Exported function "RootLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\page.tsx:9`
**Issue:** Exported function "RootPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useColumnLayoutTracker.ts:11`
**Issue:** Exported function "useColumnLayoutTracker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useDraftSession.tsx:32`
**Issue:** Exported function "useDraftSession" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useOrdersRealtimeSync.ts:10`
**Issue:** Exported function "useOrdersRealtimeSync" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\usePendingSearchSelection.ts:11`
**Issue:** Exported function "usePendingSearchSelection" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useSelectedRowsSync.ts:8`
**Issue:** Exported function "useSelectedRowsSync" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useStorageStats.ts:14`
**Issue:** Exported function "useStorageStats" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\useWarrantyExpiryMaintenance.ts:60`
**Issue:** Exported function "useWarrantyExpiryMaintenance" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\auth-session.ts:4`
**Issue:** Exported function "getServerSession" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\supabase-admin.ts:9`
**Issue:** Exported function "createServiceClient" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\supabase-browser.ts:6`
**Issue:** Exported function "getSupabaseBrowserClient" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\lib\utils.ts:16`
**Issue:** Exported function "cn" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\services\orderService.ts:272`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\services\orderService.ts:84`
**Issue:** Exported function "createOrderService" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:17`
**Issue:** Assertion "successResponse() as unknown as {
				status: number;
				bo" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:32`
**Issue:** Assertion "successResponse(data, message) as unknown as {
				status: n" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:45`
**Issue:** Assertion "successResponse(
				undefined,
				undefined,
				201,
			)" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:61`
**Issue:** Assertion "errorResponse(
				"INTERNAL_ERROR",
				"An unexpected erro" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\apiResponse.test.ts:78`
**Issue:** Assertion "errorResponse(
				"VALIDATION_ERROR",
				"Invalid input",
" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\CallCustomerCounter.test.tsx:30`
**Issue:** Assertion "[
			{ id: "1", vin: "VIN123" },
			{ id: "2", vin: "" },
		" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\exportUtils.test.ts:128`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\exportUtils.test.ts:143`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:26`
**Issue:** Assertion "{
			setAttribute: vi.fn(),
			style: { visibility: "" },
		" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:39`
**Issue:** Assertion "null as unknown as Node" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:42`
**Issue:** Assertion "null as unknown as Node" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:128`
**Issue:** Assertion "document.createElement as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\exportUtils.test.ts:143`
**Issue:** Assertion "document.createElement as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:38`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:40`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\inventorySlice.test.ts:43`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:38`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\inventorySlice.test.ts:40`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:23`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:95`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\mobileOrderService.test.ts:98`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** Assertion "supabase.from as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:95`
**Issue:** Assertion "supabase.from as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\mobileOrderService.test.ts:98`
**Issue:** Assertion "ordersBuilder.insert as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:62`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:70`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:84`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\notificationSlice.test.ts:91`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:60`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:60`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:62`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:82`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:82`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\notificationSlice.test.ts:84`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:29`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:59`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValueOnce: Function " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:78`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:103`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValueOnce: Function " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:165`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:290`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:323`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:351`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:378`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:417`
**Issue:** Assertion "supabase.from as unknown as { mockReturnValue: Function }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderService.test.ts:505`
**Issue:** Assertion "{ from: mockFrom } as unknown as Parameters<
				typeof crea" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\ordersSlice.test.ts:38`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\ordersSlice.test.ts:44`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:36`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Bypas" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\ordersSlice.test.ts:38`
**Issue:** Assertion "a[2] as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderWorkflow.test.ts:313`
**Issue:** Assertion "null as unknown as string" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\orderWorkflow.test.ts:314`
**Issue:** Assertion "undefined as unknown as string" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:31`
**Issue:** Assertion "{
		headers: new Headers(),
		url,
		json: () => Promise.res" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:198`
**Issue:** Assertion "res.body as unknown as { error: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\quickTemplatesRoute.test.ts:233`
**Issue:** Assertion "res.body as unknown as { id: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reservationLabels.test.ts:35`
**Issue:** Assertion "mockPrintWindow as unknown as Window" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:61`
**Issue:** Assertion "req as unknown as import("next/server").NextRequest" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:90`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:108`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:126`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:149`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:174`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\storageStatsRoute.test.ts:187`
**Issue:** Assertion "response.body as unknown as Record<string, unknown>" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:66`
**Issue:** Assertion "{
			data: [makeRow({ id: "r1", vin: "VIN111", status: "Arri" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:77`
**Issue:** Assertion "{
			data: [
				makeRow({ id: "r1", vin: "VIN222", status: " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:95`
**Issue:** Assertion "{
			data: [
				makeRow({ id: "r1", vin: "VIN333", status: " bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:109`
**Issue:** Assertion "{
			data: [makeRow({ id: "r1", vin: "", status: "Arrived" }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:120`
**Issue:** Assertion "{
			data: undefined,
		} as unknown as ReturnType<typeof us" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:131`
**Issue:** Assertion "{
			data: [
				// VIN_A: all arrived → should move
				mak" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:156`
**Issue:** Assertion "{ data: [row] } as unknown as ReturnType<
			typeof useOrder" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useAutoMoveVins.test.ts:164`
**Issue:** Assertion "{
			data: [{ ...row }],
		} as unknown as ReturnType<typeof" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\useColumnLayoutTracker.test.ts:32`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useColumnLayoutTracker.test.ts:32`
**Issue:** Assertion "window as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\useWarrantyExpiryMaintenance.test.ts:49`
**Issue:** Assertion "{
		id: "row-1",
		stage: "orders",
		vin: "VIN0001",
		repa" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\layout.tsx:14`
**Issue:** Exported function "AppLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\layout.tsx:5`
**Issue:** Exported function "AuthLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\draft-session-test\page.tsx:5`
**Issue:** Exported function "DraftSessionTestPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\mobile-order\layout.tsx:9`
**Issue:** Exported function "MobileOrderLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\mobile-order\page.tsx:29`
**Issue:** Exported function "MobileOrderPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\AuthPageShell.tsx:17`
**Issue:** Exported function "AuthPageShell" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\ForgotPasswordForm.tsx:13`
**Issue:** Exported function "ForgotPasswordForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\LoginForm.tsx:17`
**Issue:** Exported function "LoginForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\auth\ResetPasswordForm.tsx:15`
**Issue:** Exported function "ResetPasswordForm" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\components\grid\DataGrid.tsx:339`
**Issue:** Assertion "params.data as unknown as object" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\DuplicateOrderWarningModal.tsx:20`
**Issue:** Exported function "DuplicateOrderWarningModal" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\providers\QueryProvider.tsx:28`
**Issue:** Exported function "QueryProvider" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\BackupReportsTab.tsx:11`
**Issue:** Exported function "BackupReportsTab" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\FrequencyPicker.tsx:26`
**Issue:** Exported function "FrequencyPicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\LostSalesReportView.tsx:347`
**Issue:** Exported function "LostSalesReportView" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ManualActionCard.tsx:23`
**Issue:** Exported function "ManualActionCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\RecipientsCard.tsx:26`
**Issue:** Exported function "RecipientsCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportExportMenu.tsx:51`
**Issue:** Exported function "ReportExportMenu" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportFilters.tsx:18`
**Issue:** Exported function "ReportFilters" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\ReportsHub.tsx:12`
**Issue:** Exported function "ReportsHub" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\reports\SchedulingCard.tsx:22`
**Issue:** Exported function "SchedulingCard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\AppShell.tsx:22`
**Issue:** Exported function "AppShell" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\EditableSelect.tsx:34`
**Issue:** Exported function "EditableSelect" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\LayoutSaveButton.tsx:40`
**Issue:** Exported function "LayoutSaveButton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\Logo.tsx:1`
**Issue:** Exported function "Logo" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SelectAllByVinButton.tsx:17`
**Issue:** Exported function "SelectAllByVinButton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SessionGuard.tsx:16`
**Issue:** Exported function "SessionGuard" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\components\shared\SettingsModal.tsx:32`
**Issue:** Assertion "window as unknown as { __SETTINGS_PASSWORD__?: string }" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\shared\SidebarUserMenu.tsx:17`
**Issue:** Exported function "SidebarUserMenu" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\testing\DraftSessionRecoveryHarness.tsx:464`
**Issue:** Exported function "DraftSessionRecoveryHarness" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\badge.tsx:30`
**Issue:** Exported function "Badge" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:517`
**Issue:** Exported function "ChartTooltip" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:678`
**Issue:** Exported function "Grid" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:791`
**Issue:** Exported function "BarXAxis" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:882`
**Issue:** Exported function "BarYAxis" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:962`
**Issue:** Exported function "Bar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1135`
**Issue:** Exported function "Legend" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1149`
**Issue:** Exported function "LegendItemComponent" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1163`
**Issue:** Exported function "LegendMarker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1176`
**Issue:** Exported function "LegendLabel" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1203`
**Issue:** Exported function "PatternLines" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1260`
**Issue:** Exported function "BarLineIndicator" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\bar-chart.tsx:1617`
**Issue:** Exported function "BarChart" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\calendar.tsx:11`
**Issue:** Exported function "Calendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\date-time-picker.tsx:27`
**Issue:** Exported function "DateTimePicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\components\ui\origin-calendar.tsx:64`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\origin-calendar.tsx:11`
**Issue:** Exported function "Calendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\shining-text.tsx:11`
**Issue:** Exported function "ShiningText" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\simple-date-picker.tsx:30`
**Issue:** Exported function "SimpleDatePicker" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\ui\skeleton.tsx:4`
**Issue:** Exported function "Skeleton" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\mutations\useUpdateAppSettingsMutation.ts:9`
**Issue:** Exported function "useUpdateAppSettingsMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useAppSettingsQuery.ts:22`
**Issue:** Exported function "useAppSettingsQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useBulkDeleteOrdersMutation.ts:19`
**Issue:** Exported function "useBulkDeleteOrdersMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useBulkUpdateOrderStageMutation.ts:27`
**Issue:** Exported function "useBulkUpdateOrderStageMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:9`
**Issue:** Exported function "quickTemplatesQueryKey" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:13`
**Issue:** Exported function "useQuickTemplatesQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:21`
**Issue:** Exported function "useAddQuickTemplateMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:56`
**Issue:** Exported function "useRemoveQuickTemplateMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\useSaveOrderMutation.ts:18`
**Issue:** Exported function "useSaveOrderMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\api\mobile-order.route.test.ts:14`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:61`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:90`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:94`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:111`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:115`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:131`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:148`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\ManualActionCard.test.tsx:171`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:90`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:91`
**Issue:** Assertion "{
			mutateAsync,
			isPending: false,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:103`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:112`
**Issue:** Assertion "{
			mutateAsync,
			isPending: true,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:123`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:140`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\ManualActionCard.test.tsx:163`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:43`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:57`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:70`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:94`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:97`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:100`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:118`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:134`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:152`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:169`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\RecipientsCard.test.tsx:188`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:94`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:95`
**Issue:** Assertion "{
			mutate: addMutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:98`
**Issue:** Assertion "{
			mutate: removeMutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:110`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: ["a@test.com", "b@test" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:126`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:144`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:161`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\RecipientsCard.test.tsx:180`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: ["keep@test.com", "rem" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:12`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:30`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:48`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsService.test.ts:73`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:12`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:30`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:48`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsService.test.ts:73`
**Issue:** Assertion "global.fetch as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsSlice.test.ts:21`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\reportSettingsSlice.test.ts:22`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:19`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Test-" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:19`
**Issue:** Assertion "({
					// biome-ignore lint/suspicious/noExplicitAny: Test-" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\reportSettingsSlice.test.ts:21`
**Issue:** Assertion "store as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:33`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:41`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:54`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:73`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:76`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:99`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:115`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Use of "any" type
**File:** `src\test\reports\SchedulingCard.test.tsx:133`
**Issue:** Explicit "any" disables type checking at this location.
**Fix:** Replace with a precise type or "unknown" + narrowing.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:73`
**Issue:** Assertion "{ data: null } as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:74`
**Issue:** Assertion "{
			mutate,
		} as any" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:91`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:107`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Unsafe type assertion
**File:** `src\test\reports\SchedulingCard.test.tsx:125`
**Issue:** Assertion "{
			data: {
				id: "1",
				emails: [],
				frequency: "We" bypasses the type system.
**Fix:** Use a type guard or fix the underlying type.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\archive\layout.tsx:12`
**Issue:** Exported function "ArchiveLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\archive\page.tsx:65`
**Issue:** Exported function "ArchivePage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\booking\layout.tsx:12`
**Issue:** Exported function "BookingLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\booking\page.tsx:69`
**Issue:** Exported function "BookingPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\call-list\layout.tsx:12`
**Issue:** Exported function "CallListLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\call-list\page.tsx:68`
**Issue:** Exported function "CallListPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\dashboard\layout.tsx:12`
**Issue:** Exported function "DashboardLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\dashboard\page.tsx:40`
**Issue:** Exported function "DashboardPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\main-sheet\layout.tsx:12`
**Issue:** Exported function "MainSheetLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\main-sheet\page.tsx:57`
**Issue:** Exported function "MainSheetPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\orders\layout.tsx:11`
**Issue:** Exported function "OrdersLayout" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\orders\page.tsx:44`
**Issue:** Exported function "OrdersPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(app)\reports\page.tsx:3`
**Issue:** Exported function "ReportsPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\forgot-password\page.tsx:4`
**Issue:** Exported function "ForgotPasswordPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\login\page.tsx:8`
**Issue:** Exported function "LoginPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\(auth)\reset-password\page.tsx:5`
**Issue:** Exported function "ResetPasswordPage" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\app-settings\route.ts:13`
**Issue:** Exported function "PATCH" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\health\route.ts:17`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\health\route.ts:73`
**Issue:** Exported function "HEAD" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\mobile-order\route.ts:10`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:17`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:49`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\quick-templates\route.ts:91`
**Issue:** Exported function "DELETE" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\report-settings\route.ts:16`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\report-settings\route.ts:53`
**Issue:** Exported function "PATCH" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\storage-stats\route.ts:123`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\trigger-backup\route.ts:8`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\booking\hooks\useBookingCalendar.ts:31`
**Issue:** Exported function "useBookingCalendar" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\grid\hooks\useGridCallbacks.ts:18`
**Issue:** Exported function "useGridCallbacks" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\grid\hooks\useGridPerformance.ts:11`
**Issue:** Exported function "useGridPerformance" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:9`
**Issue:** Exported function "useReportSettingsQuery" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:16`
**Issue:** Exported function "useUpdateReportSettingsMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:67`
**Issue:** Exported function "useAddEmailRecipientMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:87`
**Issue:** Exported function "useRemoveEmailRecipientMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:109`
**Issue:** Exported function "useTriggerManualBackupMutation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\maintenance\archive-expired-warranties\route.ts:5`
**Issue:** Exported function "GET" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\app\api\password-reset\request\route.ts:32`
**Issue:** Exported function "POST" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderFormState.ts:7`
**Issue:** Exported function "useOrderFormState" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderParts.ts:5`
**Issue:** Exported function "useOrderParts" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:32`
**Issue:** Exported function "useOrderSubmit" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

## 🟡 WARNING — Missing return type annotation
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderValidation.ts:24`
**Issue:** Exported function "useOrderValidation" has no explicit return type.
**Fix:** Add an explicit return type annotation.

---

# Dead Code

## 🔵 INFO — Isolated zombie file
**File:** `test-biome.ts`
**Issue:** File has no imports and no exports.
**Fix:** Delete it if unused, or wire it into the module graph.

---

## 🟡 WARNING — Unused export
**File:** `src\middleware.ts:33`
**Issue:** Export "middleware" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\middleware.ts:112`
**Issue:** Export "config" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\layout.tsx:17`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useAutoMoveVins.ts:21`
**Issue:** Export "useAutoMoveVins" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useDraftSession.tsx:32`
**Issue:** Export "useDraftSession" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useOrdersRealtimeSync.ts:10`
**Issue:** Export "useOrdersRealtimeSync" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\usePendingSearchSelection.ts:11`
**Issue:** Export "usePendingSearchSelection" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useRowModals.ts:10`
**Issue:** Export "RowModalType" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useRowModals.ts:20`
**Issue:** Export "useRowModals" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useSessionStatus.ts:36`
**Issue:** Export "useSessionStatus" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useSessionStatus.ts:6`
**Issue:** Export "SessionStatus" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useStorageStats.ts:14`
**Issue:** Export "useStorageStats" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\useWarrantyExpiryMaintenance.ts:60`
**Issue:** Export "useWarrantyExpiryMaintenance" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ag-grid-helpers.ts:3`
**Issue:** Export "ensurePagedRowVisible" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ag-grid-helpers.ts:74`
**Issue:** Export "trySelectRowsByVin" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ag-grid-setup.ts:4`
**Issue:** Export "gridTheme" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\apiResponse.ts:4`
**Issue:** Export "ApiSuccessResponse" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\apiResponse.ts:10`
**Issue:** Export "ApiErrorResponse" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\apiResponse.ts:19`
**Issue:** Export "ApiResponse" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\archivePayloadBuilder.ts:15`
**Issue:** Export "buildArchivePayload" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:14`
**Issue:** Export "isSupportedAttachmentFile" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:18`
**Issue:** Export "isValidFileSize" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:22`
**Issue:** Export "detectAttachmentKind" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:51`
**Issue:** Export "sanitizeAttachmentLink" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:56`
**Issue:** Export "buildStorageObjectPath" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:62`
**Issue:** Export "getAttachmentsBucket" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:66`
**Issue:** Export "hasAttachment" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:76`
**Issue:** Export "isAtAttachmentLimit" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\attachment.ts:4`
**Issue:** Export "AttachmentValue" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\auth-client.ts:4`
**Issue:** Export "authClient" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\auth-session.ts:4`
**Issue:** Export "getServerSession" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\callRepairSystemFilter.ts:3`
**Issue:** Export "RepairSystemFilterOption" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\callRepairSystemFilter.ts:15`
**Issue:** Export "getRepairSystemFilterOptions" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\callRepairSystemFilter.ts:35`
**Issue:** Export "filterRowsByRepairSystems" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🔵 INFO — Isolated zombie file
**File:** `src\lib\company.ts`
**Issue:** File has no imports and no exports.
**Fix:** Delete it if unused, or wire it into the module graph.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\constants.ts:9`
**Issue:** Export "SEARCH_DEBOUNCE_MS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\constants.ts:12`
**Issue:** Export "AUTO_MOVE_DEBOUNCE_MS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\constants.ts:15`
**Issue:** Export "DRAFT_RECOVERY_MAX_AGE_MS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\constants.ts:33`
**Issue:** Export "ERROR_MESSAGE_TRUNCATE_LENGTH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\constants.ts:36`
**Issue:** Export "ORDER_STAGES" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\errors.ts:1`
**Issue:** Export "OrderMappingError" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\exportUtils.ts:10`
**Issue:** Export "exportToLogisticsXLSX" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\logger.ts:1`
**Issue:** Export "logger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\orderStage.ts:14`
**Issue:** Export "normalizeOrderStage" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\orderStageTransitions.ts:19`
**Issue:** Export "buildSendToArchiveCommands" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\orderStageTransitions.ts:38`
**Issue:** Export "buildReorderCommands" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\orderStageTransitions.ts:68`
**Issue:** Export "buildBookingCommands" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\orderStageTransitions.ts:101`
**Issue:** Export "buildRebookingCommands" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:6`
**Issue:** Export "ValidationMode" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:11`
**Issue:** Export "ALLOWED_COMPANIES" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:15`
**Issue:** Export "DEFAULT_COMPANY" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:17`
**Issue:** Export "VIN_MIN_LENGTH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:18`
**Issue:** Export "VIN_STANDARD_LENGTH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\ordersValidationConstants.ts:20`
**Issue:** Export "DUPLICATE_CHECK_VIN_MIN_LENGTH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🔵 INFO — Isolated zombie file
**File:** `src\lib\orderWorkflow.ts`
**Issue:** File has no imports and no exports.
**Fix:** Delete it if unused, or wire it into the module graph.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:8`
**Issue:** Export "OrdersCacheSnapshot" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:12`
**Issue:** Export "BulkStageContext" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:18`
**Issue:** Export "DeleteContext" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:23`
**Issue:** Export "getErrorMessage" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:44`
**Issue:** Export "getMovedRowsById" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryCacheHelpers.ts:64`
**Issue:** Export "restoreOrdersCache" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryClient.ts:8`
**Issue:** Export "getOrdersQueryKey" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryClient.ts:11`
**Issue:** Export "getOrdersByStageFromCache" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryClient.ts:16`
**Issue:** Export "isStageCacheLoaded" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\queryClient.ts:23`
**Issue:** Export "queryClient" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\supabase-admin.ts:9`
**Issue:** Export "createServiceClient" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\utils.ts:16`
**Issue:** Export "cn" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\utils.ts:35`
**Issue:** Export "getVinColor" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\utils.ts:139`
**Issue:** Export "generateId" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\utils.ts:148`
**Issue:** Export "mapKeysToCamel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:3`
**Issue:** Export "LoginFormSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:8`
**Issue:** Export "LoginFormData" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:10`
**Issue:** Export "ForgotPasswordFormSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:14`
**Issue:** Export "ForgotPasswordFormData" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:16`
**Issue:** Export "ResetPasswordFormSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\auth.schema.ts:28`
**Issue:** Export "ResetPasswordFormData" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\form.schema.ts:59`
**Issue:** Export "BeastModeSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\mobileOrder.schema.ts:12`
**Issue:** Export "MobileQuickOrderSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\mobileOrder.schema.ts:33`
**Issue:** Export "MobileQuickOrderPayload" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:10`
**Issue:** Export "PartEntrySchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:166`
**Issue:** Export "ReminderInputSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:184`
**Issue:** Export "PartEntry" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:185`
**Issue:** Export "PendingRow" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:190`
**Issue:** Export "PersistedOrderRowSchema" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\schemas\order.schema.ts:192`
**Issue:** Export "PersistedOrderRow" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\appSettingsService.ts:3`
**Issue:** Export "AppSettings" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\appSettingsService.ts:9`
**Issue:** Export "appSettingsService" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\quickTemplatesService.ts:1`
**Issue:** Export "TemplateCategory" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\quickTemplatesService.ts:3`
**Issue:** Export "QuickTemplate" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\quickTemplatesService.ts:12`
**Issue:** Export "quickTemplatesService" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\warrantyMaintenanceService.ts:23`
**Issue:** Export "warrantyMaintenanceService" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\ordersQueryAdapter.ts:38`
**Issue:** Export "setOrdersQueryAdapter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\ordersQueryAdapter.ts:57`
**Issue:** Export "createReactQueryAdapter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\ordersQueryAdapter.ts:73`
**Issue:** Export "__resetOrdersQueryAdapterForTests" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\ordersQueryAdapter.ts:17`
**Issue:** Export "OrdersQueryAdapter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\types.ts:124`
**Issue:** Export "StoreState" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\types.ts:132`
**Issue:** Export "StoreActions" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:5`
**Issue:** Export "DuplicateCheckResult" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:11`
**Issue:** Export "DescriptionConflictResult" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:17`
**Issue:** Export "AppNotification" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:39`
**Issue:** Export "StickyNote" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:46`
**Issue:** Export "PartStatusDef" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:52`
**Issue:** Export "BookingStatus" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\types\index.ts:53`
**Issue:** Export "PartStatus" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\utils\safeFormatDate.ts:8`
**Issue:** Export "parseDateLocal" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\utils\safeFormatDate.ts:29`
**Issue:** Export "safeFormatDate" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\mobile-order\layout.tsx:4`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\auth\AuthPageShell.tsx:17`
**Issue:** Export "AuthPageShell" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\auth\ForgotPasswordForm.tsx:13`
**Issue:** Export "ForgotPasswordForm" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\auth\LoginForm.tsx:17`
**Issue:** Export "LoginForm" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\auth\ResetPasswordForm.tsx:15`
**Issue:** Export "ResetPasswordForm" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\main-sheet\MainSheetToolbar.tsx:59`
**Issue:** Export "MainSheetToolbar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\orders\OrderFormErrorBoundary.tsx:21`
**Issue:** Export "OrderFormErrorBoundary" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\orders\OrdersToolbar.tsx:62`
**Issue:** Export "OrdersToolbar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\reports\LostSalesReportView.tsx:347`
**Issue:** Export "LostSalesReportView" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\reports\ReportExportMenu.tsx:51`
**Issue:** Export "ReportExportMenu" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\reports\ReportFilters.tsx:18`
**Issue:** Export "ReportFilters" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\reports\ReportsHub.tsx:12`
**Issue:** Export "ReportsHub" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\AppShell.tsx:22`
**Issue:** Export "AppShell" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\BookingCalendarModal.tsx:27`
**Issue:** Export "BookingCalendarModal" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\CallCustomerCounter.tsx:19`
**Issue:** Export "CallCustomerCounter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\CallRepairSystemFilter.tsx:30`
**Issue:** Export "CallRepairSystemFilter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\ClientErrorBoundary.tsx:17`
**Issue:** Export "ClientErrorBoundary" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\ConfirmDialog.tsx:73`
**Issue:** Export "ConfirmDialog" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\EditableSelect.tsx:34`
**Issue:** Export "EditableSelect" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\GridConfig.tsx:281`
**Issue:** Export "getCallColumns" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\GridConfig.tsx:311`
**Issue:** Export "SearchHeaderCheckboxState" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\Header.tsx:42`
**Issue:** Export "Header" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\headerNotificationPolling.ts:3`
**Issue:** Export "NOTIFICATION_FRESHNESS_WINDOW_MS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\headerNotificationPolling.ts:5`
**Issue:** Export "NotificationPollingState" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\InfoLabel.tsx:10`
**Issue:** Export "InfoLabel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\LayoutSaveButton.tsx:40`
**Issue:** Export "LayoutSaveButton" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\MainContentWrapper.tsx:24`
**Issue:** Export "MainContentWrapper" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\SearchResultsView.tsx:23`
**Issue:** Export "SearchResultsView" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\SelectAllByVinButton.tsx:17`
**Issue:** Export "SelectAllByVinButton" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\SessionGuard.tsx:16`
**Issue:** Export "SessionGuard" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\Sidebar.tsx:83`
**Issue:** Export "Sidebar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\VINLineCounter.tsx:15`
**Issue:** Export "VINLineCounter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\testing\DraftSessionRecoveryHarness.tsx:464`
**Issue:** Export "DraftSessionRecoveryHarness" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:8`
**Issue:** Export "AlertDialog" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:10`
**Issue:** Export "AlertDialogTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:29`
**Issue:** Export "AlertDialogContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:47`
**Issue:** Export "AlertDialogHeader" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:59`
**Issue:** Export "AlertDialogHeader" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:61`
**Issue:** Export "AlertDialogFooter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:73`
**Issue:** Export "AlertDialogFooter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:75`
**Issue:** Export "AlertDialogTitle" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:87`
**Issue:** Export "AlertDialogDescription" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:100`
**Issue:** Export "AlertDialogAction" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\alert-dialog.tsx:112`
**Issue:** Export "AlertDialogCancel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\badge.tsx:30`
**Issue:** Export "Badge" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:136`
**Issue:** Export "useChart" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:517`
**Issue:** Export "ChartTooltip" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:660`
**Issue:** Export "ChartTooltip" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:678`
**Issue:** Export "Grid" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:781`
**Issue:** Export "Grid" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:791`
**Issue:** Export "BarXAxis" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:873`
**Issue:** Export "BarXAxis" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:882`
**Issue:** Export "BarYAxis" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:937`
**Issue:** Export "BarYAxis" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:962`
**Issue:** Export "Bar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1117`
**Issue:** Export "Bar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1135`
**Issue:** Export "Legend" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1147`
**Issue:** Export "Legend" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1149`
**Issue:** Export "LegendItemComponent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1161`
**Issue:** Export "LegendItemComponent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1163`
**Issue:** Export "LegendMarker" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1174`
**Issue:** Export "LegendMarker" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1176`
**Issue:** Export "LegendLabel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1186`
**Issue:** Export "LegendLabel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1203`
**Issue:** Export "PatternLines" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1247`
**Issue:** Export "PatternLines" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1260`
**Issue:** Export "BarLineIndicator" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1306`
**Issue:** Export "BarLineIndicator" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1617`
**Issue:** Export "BarChart" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:40`
**Issue:** Export "chartCssVars" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:53`
**Issue:** Export "Margin" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:60`
**Issue:** Export "TooltipData" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:68`
**Issue:** Export "TooltipRow" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:74`
**Issue:** Export "LineConfig" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:87`
**Issue:** Export "BarChartContextValue" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:505`
**Issue:** Export "ChartTooltipProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:664`
**Issue:** Export "GridProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:785`
**Issue:** Export "BarXAxisProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:877`
**Issue:** Export "BarYAxisProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:941`
**Issue:** Export "BarProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1129`
**Issue:** Export "LegendProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1194`
**Issue:** Export "PatternLinesProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1251`
**Issue:** Export "BarLineIndicatorProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\bar-chart.tsx:1345`
**Issue:** Export "BarChartProps" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\button.tsx:42`
**Issue:** Export "Button" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\button.tsx:6`
**Issue:** Export "buttonVariants" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\calendar.tsx:11`
**Issue:** Export "Calendar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\calendar.tsx:65`
**Issue:** Export "Calendar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:4`
**Issue:** Export "Card" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:19`
**Issue:** Export "CardHeader" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:66`
**Issue:** Export "CardFooter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:31`
**Issue:** Export "CardTitle" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:46`
**Issue:** Export "CardDescription" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\card.tsx:58`
**Issue:** Export "CardContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:9`
**Issue:** Export "ChartConfig" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:39`
**Issue:** Export "ChartContainer" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:109`
**Issue:** Export "ChartTooltip" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:111`
**Issue:** Export "ChartTooltipContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:267`
**Issue:** Export "ChartLegend" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\chart.tsx:269`
**Issue:** Export "ChartLegendContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\checkbox.tsx:8`
**Issue:** Export "Checkbox" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:156`
**Issue:** Export "ComboboxChipsInput" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:183`
**Issue:** Export "ComboboxInput" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:266`
**Issue:** Export "ComboboxTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:282`
**Issue:** Export "ComboboxPopup" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:333`
**Issue:** Export "ComboboxItem" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:368`
**Issue:** Export "ComboboxSeparator" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:381`
**Issue:** Export "ComboboxGroup" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:394`
**Issue:** Export "ComboboxGroupLabel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:410`
**Issue:** Export "ComboboxEmpty" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:426`
**Issue:** Export "ComboboxRow" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:439`
**Issue:** Export "ComboboxValue" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:445`
**Issue:** Export "ComboboxList" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:463`
**Issue:** Export "ComboboxClear" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:476`
**Issue:** Export "ComboboxStatus" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:492`
**Issue:** Export "ComboboxCollection" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:500`
**Issue:** Export "ComboboxChips" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:536`
**Issue:** Export "ComboboxChip" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:561`
**Issue:** Export "ComboboxChipRemove" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:11`
**Issue:** Export "ComboboxSize" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:129`
**Issue:** Export "ComboboxContext" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\combobox.tsx:576`
**Issue:** Export "useComboboxFilter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\command.tsx:39`
**Issue:** Export "CommandInput" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\command.tsx:58`
**Issue:** Export "CommandList" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\command.tsx:71`
**Issue:** Export "CommandEmpty" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\command.tsx:84`
**Issue:** Export "CommandGroup" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\command.tsx:112`
**Issue:** Export "CommandItem" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:8`
**Issue:** Export "Dialog" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:28`
**Issue:** Export "DialogContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:56`
**Issue:** Export "DialogHeader" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:68`
**Issue:** Export "DialogHeader" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:70`
**Issue:** Export "DialogFooter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:82`
**Issue:** Export "DialogFooter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:84`
**Issue:** Export "DialogTitle" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dialog.tsx:99`
**Issue:** Export "DialogDescription" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dropdown-menu.tsx:9`
**Issue:** Export "DropdownMenu" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dropdown-menu.tsx:11`
**Issue:** Export "DropdownMenuTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dropdown-menu.tsx:59`
**Issue:** Export "DropdownMenuContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\dropdown-menu.tsx:77`
**Issue:** Export "DropdownMenuItem" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\input.tsx:6`
**Issue:** Export "Input" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\label.tsx:12`
**Issue:** Export "Label" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-calendar.tsx:11`
**Issue:** Export "Calendar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-calendar.tsx:96`
**Issue:** Export "Calendar" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-select.tsx:12`
**Issue:** Export "Select" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-select.tsx:73`
**Issue:** Export "SelectContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-select.tsx:119`
**Issue:** Export "SelectItem" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-select.tsx:18`
**Issue:** Export "SelectTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\origin-select.tsx:16`
**Issue:** Export "SelectValue" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\playful-todolist.tsx:9`
**Issue:** Export "PlayfulTodoItem" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\playful-todolist.tsx:38`
**Issue:** Export "PlayfulTodolist" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\popover.tsx:8`
**Issue:** Export "Popover" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\popover.tsx:10`
**Issue:** Export "PopoverTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\popover.tsx:12`
**Issue:** Export "PopoverContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\shining-text.tsx:11`
**Issue:** Export "ShiningText" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\simple-date-picker.tsx:30`
**Issue:** Export "SimpleDatePicker" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\skeleton.tsx:4`
**Issue:** Export "Skeleton" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\switch.tsx:8`
**Issue:** Export "Switch" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\textarea.tsx:7`
**Issue:** Export "Textarea" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\tooltip.tsx:10`
**Issue:** Export "Tooltip" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\tooltip.tsx:12`
**Issue:** Export "TooltipTrigger" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\tooltip.tsx:14`
**Issue:** Export "TooltipContent" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\ui\tooltip.tsx:8`
**Issue:** Export "TooltipProvider" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\company\company.ts:15`
**Issue:** Export "normalizeCompanyName" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\company\company.ts:47`
**Issue:** Export "normalizeNullableCompanyName" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\company\company.ts:62`
**Issue:** Export "isAllowedCompanyName" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\mileage.ts:5`
**Issue:** Export "normalizeMileage" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\mileage.ts:22`
**Issue:** Export "normalizeMileageAsNumber" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:111`
**Issue:** Export "normalizeVin" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:126`
**Issue:** Export "isVinComplete" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:131`
**Issue:** Export "isVinLongEnoughForDuplicateCheck" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:136`
**Issue:** Export "getVinAutoMoveIds" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:186`
**Issue:** Export "checkVinPartDuplicate" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:217`
**Issue:** Export "checkDescriptionConflict" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:248`
**Issue:** Export "findSameOrderDuplicates" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:270`
**Issue:** Export "findSameOrderDuplicateIndices" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:293`
**Issue:** Export "shouldSkipDuplicateCheck" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:309`
**Issue:** Export "getVinBucket" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:315`
**Issue:** Export "getNormalizedVinBuckets" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:329`
**Issue:** Export "formatVinForDisplay" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:335`
**Issue:** Export "hasMixedVinSelection" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:346`
**Issue:** Export "getStageDisplayName" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:376`
**Issue:** Export "filterReservedRows" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:15`
**Issue:** Export "isUuid" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:28`
**Issue:** Export "appendTaggedUserNote" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:47`
**Issue:** Export "getEffectiveNoteHistory" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:96`
**Issue:** Export "getSelectedIds" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\orderWorkflow.ts:307`
**Issue:** Export "BLANK_VIN_BUCKET" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\vin.ts:13`
**Issue:** Export "detectModelFromVin" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\warranty.ts:32`
**Issue:** Export "isWarrantyExpired" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\warranty.ts:43`
**Issue:** Export "getEffectiveEndWarranty" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\warranty.ts:4`
**Issue:** Export "calculateEndWarranty" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\order\warranty.ts:16`
**Issue:** Export "calculateRemainingTime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:77`
**Issue:** Export "computeLostSalesReport" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:3`
**Issue:** Export "PartDemand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:11`
**Issue:** Export "ModelDemand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:18`
**Issue:** Export "LostSalesKpis" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:25`
**Issue:** Export "LostSalesReport" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:31`
**Issue:** Export "LostSalesCompanyFilter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:32`
**Issue:** Export "LostSalesPeriodFilter" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\domain\reports\lostSalesAnalysis.ts:34`
**Issue:** Export "LostSalesFilters" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\mutations\useUpdateAppSettingsMutation.ts:9`
**Issue:** Export "useUpdateAppSettingsMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useAppSettingsQuery.ts:22`
**Issue:** Export "useAppSettingsQuery" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useAppSettingsQuery.ts:7`
**Issue:** Export "APP_SETTINGS_QUERY_KEY" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useDashboardStatsQuery.ts:10`
**Issue:** Export "useDashboardStatsQuery" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:9`
**Issue:** Export "quickTemplatesQueryKey" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:13`
**Issue:** Export "useQuickTemplatesQuery" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:21`
**Issue:** Export "useAddQuickTemplateMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:56`
**Issue:** Export "useRemoveQuickTemplateMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportExcel.ts:7`
**Issue:** Export "exportLostSalesExcel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportFormatUtils.ts:3`
**Issue:** Export "periodLabel" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportHtml.ts:231`
**Issue:** Export "generateLostSalesHtml" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportLatex.ts:102`
**Issue:** Export "exportLostSalesLatex" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportPptx.ts:27`
**Issue:** Export "exportLostSalesPptx" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\lib\reports\reportPrint.ts:7`
**Issue:** Export "printLostSalesReport" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\services\reports\reportSettingsService.ts:5`
**Issue:** Export "reportSettingsService" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:19`
**Issue:** Export "PatchRowCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:28`
**Issue:** Export "CreateRowsCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:34`
**Issue:** Export "DeleteRowsCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:39`
**Issue:** Export "MoveRowsCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:58`
**Issue:** Export "AtomicCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:64`
**Issue:** Export "DraftCommand" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:80`
**Issue:** Export "DraftSaveMutations" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:88`
**Issue:** Export "DraftSession" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\draftSessionSlice.ts:109`
**Issue:** Export "DraftRecoverySnapshot" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\store\slices\uiSlice.ts:6`
**Issue:** Export "PROTECTED_REPAIR_SYSTEMS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\archive\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\booking\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\call-list\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\dashboard\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\main-sheet\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\(app)\orders\layout.tsx:3`
**Issue:** Export "metadata" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\app-settings\route.ts:13`
**Issue:** Export "PATCH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\app-settings\route.ts:9`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\health\route.ts:17`
**Issue:** Export "GET" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\health\route.ts:73`
**Issue:** Export "HEAD" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\health\route.ts:6`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\mobile-order\rateLimiter.ts:5`
**Issue:** Export "RATE_LIMIT_MAX" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\mobile-order\route.ts:10`
**Issue:** Export "POST" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\mobile-order\route.ts:8`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\quick-templates\route.ts:9`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\report-settings\route.ts:16`
**Issue:** Export "GET" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\report-settings\route.ts:53`
**Issue:** Export "PATCH" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\report-settings\route.ts:8`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\storage-stats\route.ts:14`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\storage-stats\route.ts:17`
**Issue:** Export "StorageStatsResponse" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\trigger-backup\route.ts:8`
**Issue:** Export "POST" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\trigger-backup\route.ts:5`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\search\searchUtils.ts:4`
**Issue:** Export "SEARCH_FIELDS" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\search\searchUtils.ts:29`
**Issue:** Export "buildGlobalSearchString" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\search\searchUtils.ts:35`
**Issue:** Export "getMissingPartRows" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useLostSalesReport.ts:21`
**Issue:** Export "useLostSalesReport" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:9`
**Issue:** Export "useReportSettingsQuery" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:16`
**Issue:** Export "useUpdateReportSettingsMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:67`
**Issue:** Export "useAddEmailRecipientMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:87`
**Issue:** Export "useRemoveEmailRecipientMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\hooks\queries\reports\useReportSettingsQuery.ts:109`
**Issue:** Export "useTriggerManualBackupMutation" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\auth\[...all]\route.ts:4`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\maintenance\archive-expired-warranties\route.ts:5`
**Issue:** Export "GET" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\password-reset\request\route.ts:32`
**Issue:** Export "POST" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\app\api\password-reset\request\route.ts:6`
**Issue:** Export "runtime" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

## 🟡 WARNING — Unused export
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:54`
**Issue:** Export "useSearchResultsState" appears to have no external references.
**Fix:** Remove the export or the symbol if it is truly unused.

---

# Dependencies

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @base-ui/react: current 1.4.1 → latest 1.5.0.
**Fix:** Upgrade @base-ui/react (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @biomejs/biome: current 2.3.10 → latest 2.4.16.
**Fix:** Upgrade @biomejs/biome (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @hookform/resolvers: current 5.2.2 → latest 5.4.0.
**Fix:** Upgrade @hookform/resolvers (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** @hugeicons/core-free-icons: current 3.1.1 → latest 4.2.0.
**Fix:** Upgrade @hugeicons/core-free-icons (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @hugeicons/react: current 1.1.4 → latest 1.1.6.
**Fix:** Upgrade @hugeicons/react (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @supabase/supabase-js: current 2.89.0 → latest 2.107.0.
**Fix:** Upgrade @supabase/supabase-js (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @t3-oss/env-nextjs: current 0.13.10 → latest 0.13.11.
**Fix:** Upgrade @t3-oss/env-nextjs (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @tanstack/react-query: current 5.90.16 → latest 5.101.0.
**Fix:** Upgrade @tanstack/react-query (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @tanstack/react-query-devtools: current 5.91.2 → latest 5.101.0.
**Fix:** Upgrade @tanstack/react-query-devtools (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @testing-library/react: current 16.3.1 → latest 16.3.2.
**Fix:** Upgrade @testing-library/react (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** @types/node: current 20.19.37 → latest 25.9.1.
**Fix:** Upgrade @types/node (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** @types/react: current 19.2.7 → latest 19.2.16.
**Fix:** Upgrade @types/react (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** @vitejs/plugin-react: current 5.1.2 → latest 6.0.2.
**Fix:** Upgrade @vitejs/plugin-react (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** ag-grid-community: current 32.3.9 → latest 35.3.1.
**Fix:** Upgrade ag-grid-community (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** ag-grid-react: current 32.3.9 → latest 35.3.1.
**Fix:** Upgrade ag-grid-react (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** autoprefixer: current 10.4.23 → latest 10.5.0.
**Fix:** Upgrade autoprefixer (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** better-auth: current 1.5.6 → latest 1.6.14.
**Fix:** Upgrade better-auth (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** date-fns: current 4.1.0 → latest 4.4.0.
**Fix:** Upgrade date-fns (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** dotenv: current 16.6.1 → latest 17.4.2.
**Fix:** Upgrade dotenv (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** framer-motion: current 12.27.0 → latest 12.40.0.
**Fix:** Upgrade framer-motion (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** jsdom: current 27.3.0 → latest 29.1.1.
**Fix:** Upgrade jsdom (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** knip: current 5.88.1 → latest 6.15.0.
**Fix:** Upgrade knip (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** kysely: current 0.28.14 → latest 0.29.2.
**Fix:** Upgrade kysely (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** lucide-react: current 0.468.0 → latest 1.17.0.
**Fix:** Upgrade lucide-react (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** motion: current 12.27.0 → latest 12.40.0.
**Fix:** Upgrade motion (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** next: current 15.5.15 → latest 16.2.7.
**Fix:** Upgrade next (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** nodemailer: current 8.0.7 → latest 8.0.10.
**Fix:** Upgrade nodemailer (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** pg: current 8.20.0 → latest 8.21.0.
**Fix:** Upgrade pg (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** pg-connection-string: current 2.12.0 → latest 2.13.0.
**Fix:** Upgrade pg-connection-string (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** postcss: current 8.5.14 → latest 8.5.15.
**Fix:** Upgrade postcss (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** react: current 19.2.3 → latest 19.2.7.
**Fix:** Upgrade react (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** react-day-picker: current 9.13.0 → latest 10.0.1.
**Fix:** Upgrade react-day-picker (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** react-dom: current 19.2.3 → latest 19.2.7.
**Fix:** Upgrade react-dom (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** react-hook-form: current 7.72.0 → latest 7.77.0.
**Fix:** Upgrade react-hook-form (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** recharts: current 2.15.4 → latest 3.8.1.
**Fix:** Upgrade recharts (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** resend: current 6.9.4 → latest 6.12.4.
**Fix:** Upgrade resend (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** sonner: current 1.7.4 → latest 2.0.7.
**Fix:** Upgrade sonner (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** tailwind-merge: current 2.6.0 → latest 3.6.0.
**Fix:** Upgrade tailwind-merge (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** tailwindcss: current 3.4.19 → latest 4.3.0.
**Fix:** Upgrade tailwindcss (review changelog if a major version jump).

---

## 🟡 WARNING — Outdated dependency
**File:** `package.json`
**Issue:** typescript: current 5.9.3 → latest 6.0.3.
**Fix:** Upgrade typescript (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** vitest: current 4.0.16 → latest 4.1.8.
**Fix:** Upgrade vitest (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** zod: current 4.3.6 → latest 4.4.3.
**Fix:** Upgrade zod (review changelog if a major version jump).

---

## 🔵 INFO — Outdated dependency
**File:** `package.json`
**Issue:** zustand: current 5.0.9 → latest 5.0.14.
**Fix:** Upgrade zustand (review changelog if a major version jump).

---

# API Surface

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\maintenance\archive-expired-warranties\route.ts:5`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `src\app\api\maintenance\archive-expired-warranties\route.ts:5`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-af46d05b3bad2740b\src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac61263a9aba2ef44\src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-ac607731a8424eb22\src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-abf5f333f245f0f11\src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\trigger-backup\route.ts:8`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\storage-stats\route.ts:123`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\report-settings\route.ts:16`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\report-settings\route.ts:53`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\password-reset\request\route.ts:32`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\mobile-order\route.ts:10`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\health\route.ts:17`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

## 🟡 WARNING — Route without authentication
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\health\route.ts:17`
**Issue:** No authentication middleware/identifier detected in this route file.
**Fix:** Add auth middleware or document why the route is public.

---

## 🟡 WARNING — Route without input validation
**File:** `.claude\worktrees\agent-a0c4648e992e57f10\src\app\api\app-settings\route.ts:13`
**Issue:** No zod/joi/yup validation detected in this route file.
**Fix:** Validate request input with a schema before use.

---

# Performance

## 🔵 INFO — Query without pagination
**File:** `src\hooks\useSelectedRowsSync.ts:45`
**Issue:** "rowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\hooks\useWarrantyExpiryMaintenance.ts:122`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\lib\batchUtils.ts:18`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\appSettingsService.ts:28`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\services\mobileOrderService.ts:114`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\services\orderMapper.ts:22`
**Issue:** "row.order_reminders.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\quickTemplatesService.ts:28`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\services\warrantyMaintenanceService.ts:44`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:44`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:51`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:84`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:108`
**Issue:** "result.current.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:165`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:166`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:167`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\gridConfig.test.ts:175`
**Issue:** "columns.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\mobileOrderService.test.ts:92`
**Issue:** "(supabase.from as any).mock.results.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:90`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:93`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\ordersSlice.test.ts:96`
**Issue:** "state.ordersRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\test\passwordResetRequestRoute.test.ts:105`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\passwordResetRequestRoute.test.ts:31`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\quickTemplatesService.test.ts:81`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:144`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:197`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\shared\EditAttachmentModal.tsx:212`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:388`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:389`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:390`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:391`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:392`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:393`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:394`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:395`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:396`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:397`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:398`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:399`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:400`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:401`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:402`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:403`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\GridConfig.tsx:404`
**Issue:** "baseCols.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\Sidebar.tsx:104`
**Issue:** "getOrdersByStageFromCache("orders").find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\Sidebar.tsx:110`
**Issue:** "getOrdersByStageFromCache("main").find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\domain\order\orderWorkflow.ts:380`
**Issue:** "partStatuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\services\reports\reportSettingsService.ts:24`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:462`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:625`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:628`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\store\slices\draftSessionSlice.ts:647`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\store\slices\draftSessionSlice.ts:326`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:41`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:188`
**Issue:** "sources.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:233`
**Issue:** "sources.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\notificationSlice.ts:309`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\store\slices\uiSlice.ts:101`
**Issue:** "state.partStatuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\api\mobile-order.route.test.ts:35`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Unguarded JSON operation
**File:** `src\test\api\mobile-order.route.test.ts:204`
**Issue:** JSON.stringify can throw on malformed/large input but is not in try/catch.
**Fix:** Wrap in try/catch and validate size where relevant.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:102`
**Issue:** "result.topParts.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:335`
**Issue:** "result.modelDemand.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\test\reports\lostSalesAnalysis.test.ts:337`
**Issue:** "result.modelDemand.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\archive\page.tsx:108`
**Issue:** "effectiveData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\booking\page.tsx:117`
**Issue:** "effectiveBookingData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\call-list\page.tsx:158`
**Issue:** "effectiveData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\main-sheet\page.tsx:99`
**Issue:** "effectiveRowData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\main-sheet\page.tsx:221`
**Issue:** "selectedRows.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts:100`
**Issue:** "effectiveOrdersData.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\app\(app)\orders\useOrdersPageHandlers.ts:347`
**Issue:** "selectedRows.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\app\api\storage-stats\route.ts:48`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🟡 WARNING — Await in loop
**File:** `src\app\api\storage-stats\route.ts:62`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\booking\hooks\useBookingCalendar.ts:140`
**Issue:** "sidebarGroupedBookings.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\booking\hooks\useBookingCalendar.ts:147`
**Issue:** "allBookings.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\CntrRdgCellRenderer.tsx:20`
**Issue:** "state.notifications.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\PartStatusRenderer.tsx:19`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\PartStatusRenderer.tsx:42`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\grid\renderers\StatusRenderer.tsx:12`
**Issue:** "statuses.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:352`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:385`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\shared\search\hooks\useSearchResultsState.ts:445`
**Issue:** "searchResults.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🟡 WARNING — Await in loop
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:120`
**Issue:** Awaiting inside a loop runs iterations sequentially.
**Fix:** Collect promises and use Promise.all when order/independence allows.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:141`
**Issue:** "Object.values(props.partValidationWarnings).find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:145`
**Issue:** "props.parts.find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

## 🔵 INFO — Query without pagination
**File:** `src\components\orders\form\hooks\useOrderForm\useOrderSubmit.ts:148`
**Issue:** "Object.keys(props.partValidationWarnings).find" has no visible limit/pagination.
**Fix:** Add pagination (limit/take/skip) to bound result size.

---

# Test Coverage

## 🔵 INFO — Test-to-source ratio
**Issue:** 344 test file(s) for 1465 source file(s) (ratio 0.23).
**Fix:** Maintain current coverage discipline.

---

## 🟡 WARNING — Untested export
**File:** `src\app\global-error.tsx:7`
**Issue:** Exported "GlobalError" is never referenced in any test file.
**Fix:** Add a test that exercises "GlobalError".

---

## 🟡 WARNING — Untested export
**File:** `src\app\layout.tsx:40`
**Issue:** Exported "RootLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "RootLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\page.tsx:9`
**Issue:** Exported "RootPage" is never referenced in any test file.
**Fix:** Add a test that exercises "RootPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\robots.ts:3`
**Issue:** Exported "robots" is never referenced in any test file.
**Fix:** Add a test that exercises "robots".

---

## 🟡 WARNING — Untested export
**File:** `src\app\sitemap.ts:3`
**Issue:** Exported "sitemap" is never referenced in any test file.
**Fix:** Add a test that exercises "sitemap".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\usePendingSearchSelection.ts:11`
**Issue:** Exported "usePendingSearchSelection" is never referenced in any test file.
**Fix:** Add a test that exercises "usePendingSearchSelection".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\useSessionStatus.ts:36`
**Issue:** Exported "useSessionStatus" is never referenced in any test file.
**Fix:** Add a test that exercises "useSessionStatus".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\useStorageStats.ts:14`
**Issue:** Exported "useStorageStats" is never referenced in any test file.
**Fix:** Add a test that exercises "useStorageStats".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\ag-grid-helpers.ts:3`
**Issue:** Exported "ensurePagedRowVisible" is never referenced in any test file.
**Fix:** Add a test that exercises "ensurePagedRowVisible".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\auth-email.ts:3`
**Issue:** Exported "sendResetEmail" is never referenced in any test file.
**Fix:** Add a test that exercises "sendResetEmail".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\auth-session.ts:4`
**Issue:** Exported "getServerSession" is never referenced in any test file.
**Fix:** Add a test that exercises "getServerSession".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\errors.ts:1`
**Issue:** Exported "OrderMappingError" is never referenced in any test file.
**Fix:** Add a test that exercises "OrderMappingError".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\resend.ts:5`
**Issue:** Exported "getResend" is never referenced in any test file.
**Fix:** Add a test that exercises "getResend".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\supabase-admin.ts:9`
**Issue:** Exported "createServiceClient" is never referenced in any test file.
**Fix:** Add a test that exercises "createServiceClient".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\utils.ts:16`
**Issue:** Exported "cn" is never referenced in any test file.
**Fix:** Add a test that exercises "cn".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\utils.ts:35`
**Issue:** Exported "getVinColor" is never referenced in any test file.
**Fix:** Add a test that exercises "getVinColor".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\utils.ts:139`
**Issue:** Exported "generateId" is never referenced in any test file.
**Fix:** Add a test that exercises "generateId".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\utils.ts:148`
**Issue:** Exported "mapKeysToCamel" is never referenced in any test file.
**Fix:** Add a test that exercises "mapKeysToCamel".

---

## 🟡 WARNING — Untested export
**File:** `src\store\ordersQueryAdapter.ts:38`
**Issue:** Exported "setOrdersQueryAdapter" is never referenced in any test file.
**Fix:** Add a test that exercises "setOrdersQueryAdapter".

---

## 🟡 WARNING — Untested export
**File:** `src\store\ordersQueryAdapter.ts:49`
**Issue:** Exported "getOrdersQueryAdapter" is never referenced in any test file.
**Fix:** Add a test that exercises "getOrdersQueryAdapter".

---

## 🟡 WARNING — Untested export
**File:** `src\store\ordersQueryAdapter.ts:57`
**Issue:** Exported "createReactQueryAdapter" is never referenced in any test file.
**Fix:** Add a test that exercises "createReactQueryAdapter".

---

## 🟡 WARNING — Untested export
**File:** `src\store\ordersQueryAdapter.ts:73`
**Issue:** Exported "__resetOrdersQueryAdapterForTests" is never referenced in any test file.
**Fix:** Add a test that exercises "__resetOrdersQueryAdapterForTests".

---

## 🟡 WARNING — Untested export
**File:** `src\utils\safeFormatDate.ts:8`
**Issue:** Exported "parseDateLocal" is never referenced in any test file.
**Fix:** Add a test that exercises "parseDateLocal".

---

## 🟡 WARNING — Untested export
**File:** `src\utils\safeFormatDate.ts:29`
**Issue:** Exported "safeFormatDate" is never referenced in any test file.
**Fix:** Add a test that exercises "safeFormatDate".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\layout.tsx:14`
**Issue:** Exported "AppLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "AppLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(auth)\layout.tsx:5`
**Issue:** Exported "AuthLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "AuthLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\draft-session-test\page.tsx:5`
**Issue:** Exported "DraftSessionTestPage" is never referenced in any test file.
**Fix:** Add a test that exercises "DraftSessionTestPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\mobile-order\layout.tsx:9`
**Issue:** Exported "MobileOrderLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "MobileOrderLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\mobile-order\page.tsx:29`
**Issue:** Exported "MobileOrderPage" is never referenced in any test file.
**Fix:** Add a test that exercises "MobileOrderPage".

---

## 🟡 WARNING — Untested export
**File:** `src\components\auth\AuthPageShell.tsx:17`
**Issue:** Exported "AuthPageShell" is never referenced in any test file.
**Fix:** Add a test that exercises "AuthPageShell".

---

## 🟡 WARNING — Untested export
**File:** `src\components\orders\DuplicateOrderWarningModal.tsx:20`
**Issue:** Exported "DuplicateOrderWarningModal" is never referenced in any test file.
**Fix:** Add a test that exercises "DuplicateOrderWarningModal".

---

## 🟡 WARNING — Untested export
**File:** `src\components\orders\OrderFormErrorBoundary.tsx:21`
**Issue:** Exported "OrderFormErrorBoundary" is never referenced in any test file.
**Fix:** Add a test that exercises "OrderFormErrorBoundary".

---

## 🟡 WARNING — Untested export
**File:** `src\components\providers\QueryProvider.tsx:28`
**Issue:** Exported "QueryProvider" is never referenced in any test file.
**Fix:** Add a test that exercises "QueryProvider".

---

## 🟡 WARNING — Untested export
**File:** `src\components\reports\LostSalesReportView.tsx:347`
**Issue:** Exported "LostSalesReportView" is never referenced in any test file.
**Fix:** Add a test that exercises "LostSalesReportView".

---

## 🟡 WARNING — Untested export
**File:** `src\components\reports\ReportExportMenu.tsx:51`
**Issue:** Exported "ReportExportMenu" is never referenced in any test file.
**Fix:** Add a test that exercises "ReportExportMenu".

---

## 🟡 WARNING — Untested export
**File:** `src\components\reports\ReportFilters.tsx:18`
**Issue:** Exported "ReportFilters" is never referenced in any test file.
**Fix:** Add a test that exercises "ReportFilters".

---

## 🟡 WARNING — Untested export
**File:** `src\components\reports\ReportsHub.tsx:12`
**Issue:** Exported "ReportsHub" is never referenced in any test file.
**Fix:** Add a test that exercises "ReportsHub".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\AppShell.tsx:22`
**Issue:** Exported "AppShell" is never referenced in any test file.
**Fix:** Add a test that exercises "AppShell".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\ClientErrorBoundary.tsx:17`
**Issue:** Exported "ClientErrorBoundary" is never referenced in any test file.
**Fix:** Add a test that exercises "ClientErrorBoundary".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\EditableSelect.tsx:34`
**Issue:** Exported "EditableSelect" is never referenced in any test file.
**Fix:** Add a test that exercises "EditableSelect".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\LayoutSaveButton.tsx:40`
**Issue:** Exported "LayoutSaveButton" is never referenced in any test file.
**Fix:** Add a test that exercises "LayoutSaveButton".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\Logo.tsx:1`
**Issue:** Exported "Logo" is never referenced in any test file.
**Fix:** Add a test that exercises "Logo".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\SelectAllByVinButton.tsx:17`
**Issue:** Exported "SelectAllByVinButton" is never referenced in any test file.
**Fix:** Add a test that exercises "SelectAllByVinButton".

---

## 🟡 WARNING — Untested export
**File:** `src\components\shared\SessionGuard.tsx:16`
**Issue:** Exported "SessionGuard" is never referenced in any test file.
**Fix:** Add a test that exercises "SessionGuard".

---

## 🟡 WARNING — Untested export
**File:** `src\components\testing\DraftSessionRecoveryHarness.tsx:464`
**Issue:** Exported "DraftSessionRecoveryHarness" is never referenced in any test file.
**Fix:** Add a test that exercises "DraftSessionRecoveryHarness".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:136`
**Issue:** Exported "useChart" is never referenced in any test file.
**Fix:** Add a test that exercises "useChart".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:517`
**Issue:** Exported "ChartTooltip" is never referenced in any test file.
**Fix:** Add a test that exercises "ChartTooltip".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:791`
**Issue:** Exported "BarXAxis" is never referenced in any test file.
**Fix:** Add a test that exercises "BarXAxis".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:882`
**Issue:** Exported "BarYAxis" is never referenced in any test file.
**Fix:** Add a test that exercises "BarYAxis".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:962`
**Issue:** Exported "Bar" is never referenced in any test file.
**Fix:** Add a test that exercises "Bar".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1135`
**Issue:** Exported "Legend" is never referenced in any test file.
**Fix:** Add a test that exercises "Legend".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1149`
**Issue:** Exported "LegendItemComponent" is never referenced in any test file.
**Fix:** Add a test that exercises "LegendItemComponent".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1163`
**Issue:** Exported "LegendMarker" is never referenced in any test file.
**Fix:** Add a test that exercises "LegendMarker".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1176`
**Issue:** Exported "LegendLabel" is never referenced in any test file.
**Fix:** Add a test that exercises "LegendLabel".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1203`
**Issue:** Exported "PatternLines" is never referenced in any test file.
**Fix:** Add a test that exercises "PatternLines".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1260`
**Issue:** Exported "BarLineIndicator" is never referenced in any test file.
**Fix:** Add a test that exercises "BarLineIndicator".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\bar-chart.tsx:1617`
**Issue:** Exported "BarChart" is never referenced in any test file.
**Fix:** Add a test that exercises "BarChart".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\calendar.tsx:11`
**Issue:** Exported "Calendar" is never referenced in any test file.
**Fix:** Add a test that exercises "Calendar".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:140`
**Issue:** Exported "Combobox" is never referenced in any test file.
**Fix:** Add a test that exercises "Combobox".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:156`
**Issue:** Exported "ComboboxChipsInput" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxChipsInput".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:183`
**Issue:** Exported "ComboboxInput" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxInput".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:266`
**Issue:** Exported "ComboboxTrigger" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxTrigger".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:282`
**Issue:** Exported "ComboboxPopup" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxPopup".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:333`
**Issue:** Exported "ComboboxItem" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxItem".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:368`
**Issue:** Exported "ComboboxSeparator" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxSeparator".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:381`
**Issue:** Exported "ComboboxGroup" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxGroup".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:394`
**Issue:** Exported "ComboboxGroupLabel" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxGroupLabel".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:410`
**Issue:** Exported "ComboboxEmpty" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxEmpty".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:426`
**Issue:** Exported "ComboboxRow" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxRow".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:439`
**Issue:** Exported "ComboboxValue" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxValue".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:445`
**Issue:** Exported "ComboboxList" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxList".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:463`
**Issue:** Exported "ComboboxClear" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxClear".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:476`
**Issue:** Exported "ComboboxStatus" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxStatus".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:492`
**Issue:** Exported "ComboboxCollection" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxCollection".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:500`
**Issue:** Exported "ComboboxChips" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxChips".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:536`
**Issue:** Exported "ComboboxChip" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxChip".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\combobox.tsx:561`
**Issue:** Exported "ComboboxChipRemove" is never referenced in any test file.
**Fix:** Add a test that exercises "ComboboxChipRemove".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\date-time-picker.tsx:27`
**Issue:** Exported "DateTimePicker" is never referenced in any test file.
**Fix:** Add a test that exercises "DateTimePicker".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\origin-calendar.tsx:11`
**Issue:** Exported "Calendar" is never referenced in any test file.
**Fix:** Add a test that exercises "Calendar".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\shining-text.tsx:11`
**Issue:** Exported "ShiningText" is never referenced in any test file.
**Fix:** Add a test that exercises "ShiningText".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\simple-date-picker.tsx:30`
**Issue:** Exported "SimpleDatePicker" is never referenced in any test file.
**Fix:** Add a test that exercises "SimpleDatePicker".

---

## 🟡 WARNING — Untested export
**File:** `src\components\ui\skeleton.tsx:4`
**Issue:** Exported "Skeleton" is never referenced in any test file.
**Fix:** Add a test that exercises "Skeleton".

---

## 🟡 WARNING — Untested export
**File:** `src\domain\order\orderWorkflow.ts:217`
**Issue:** Exported "checkDescriptionConflict" is never referenced in any test file.
**Fix:** Add a test that exercises "checkDescriptionConflict".

---

## 🟡 WARNING — Untested export
**File:** `src\domain\order\orderWorkflow.ts:293`
**Issue:** Exported "shouldSkipDuplicateCheck" is never referenced in any test file.
**Fix:** Add a test that exercises "shouldSkipDuplicateCheck".

---

## 🟡 WARNING — Untested export
**File:** `src\domain\order\orderWorkflow.ts:346`
**Issue:** Exported "getStageDisplayName" is never referenced in any test file.
**Fix:** Add a test that exercises "getStageDisplayName".

---

## 🟡 WARNING — Untested export
**File:** `src\domain\order\warranty.ts:32`
**Issue:** Exported "isWarrantyExpired" is never referenced in any test file.
**Fix:** Add a test that exercises "isWarrantyExpired".

---

## 🟡 WARNING — Untested export
**File:** `src\domain\order\warranty.ts:43`
**Issue:** Exported "getEffectiveEndWarranty" is never referenced in any test file.
**Fix:** Add a test that exercises "getEffectiveEndWarranty".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\mutations\useUpdateAppSettingsMutation.ts:9`
**Issue:** Exported "useUpdateAppSettingsMutation" is never referenced in any test file.
**Fix:** Add a test that exercises "useUpdateAppSettingsMutation".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\queries\useAppSettingsQuery.ts:22`
**Issue:** Exported "useAppSettingsQuery" is never referenced in any test file.
**Fix:** Add a test that exercises "useAppSettingsQuery".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\queries\useDashboardStatsQuery.ts:10`
**Issue:** Exported "useDashboardStatsQuery" is never referenced in any test file.
**Fix:** Add a test that exercises "useDashboardStatsQuery".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\queries\useQuickTemplatesQuery.ts:9`
**Issue:** Exported "quickTemplatesQueryKey" is never referenced in any test file.
**Fix:** Add a test that exercises "quickTemplatesQueryKey".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportExcel.ts:7`
**Issue:** Exported "exportLostSalesExcel" is never referenced in any test file.
**Fix:** Add a test that exercises "exportLostSalesExcel".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportFormatUtils.ts:3`
**Issue:** Exported "periodLabel" is never referenced in any test file.
**Fix:** Add a test that exercises "periodLabel".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportHtml.ts:231`
**Issue:** Exported "generateLostSalesHtml" is never referenced in any test file.
**Fix:** Add a test that exercises "generateLostSalesHtml".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportLatex.ts:102`
**Issue:** Exported "exportLostSalesLatex" is never referenced in any test file.
**Fix:** Add a test that exercises "exportLostSalesLatex".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportPptx.ts:27`
**Issue:** Exported "exportLostSalesPptx" is never referenced in any test file.
**Fix:** Add a test that exercises "exportLostSalesPptx".

---

## 🟡 WARNING — Untested export
**File:** `src\lib\reports\reportPrint.ts:7`
**Issue:** Exported "printLostSalesReport" is never referenced in any test file.
**Fix:** Add a test that exercises "printLostSalesReport".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\archive\layout.tsx:12`
**Issue:** Exported "ArchiveLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "ArchiveLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\archive\page.tsx:65`
**Issue:** Exported "ArchivePage" is never referenced in any test file.
**Fix:** Add a test that exercises "ArchivePage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\booking\layout.tsx:12`
**Issue:** Exported "BookingLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "BookingLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\booking\page.tsx:69`
**Issue:** Exported "BookingPage" is never referenced in any test file.
**Fix:** Add a test that exercises "BookingPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\call-list\layout.tsx:12`
**Issue:** Exported "CallListLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "CallListLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\call-list\page.tsx:68`
**Issue:** Exported "CallListPage" is never referenced in any test file.
**Fix:** Add a test that exercises "CallListPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\dashboard\layout.tsx:12`
**Issue:** Exported "DashboardLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "DashboardLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\dashboard\page.tsx:40`
**Issue:** Exported "DashboardPage" is never referenced in any test file.
**Fix:** Add a test that exercises "DashboardPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\main-sheet\layout.tsx:12`
**Issue:** Exported "MainSheetLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "MainSheetLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\main-sheet\page.tsx:57`
**Issue:** Exported "MainSheetPage" is never referenced in any test file.
**Fix:** Add a test that exercises "MainSheetPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\orders\layout.tsx:11`
**Issue:** Exported "OrdersLayout" is never referenced in any test file.
**Fix:** Add a test that exercises "OrdersLayout".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(app)\reports\page.tsx:3`
**Issue:** Exported "ReportsPage" is never referenced in any test file.
**Fix:** Add a test that exercises "ReportsPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(auth)\forgot-password\page.tsx:4`
**Issue:** Exported "ForgotPasswordPage" is never referenced in any test file.
**Fix:** Add a test that exercises "ForgotPasswordPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(auth)\login\page.tsx:8`
**Issue:** Exported "LoginPage" is never referenced in any test file.
**Fix:** Add a test that exercises "LoginPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\(auth)\reset-password\page.tsx:5`
**Issue:** Exported "ResetPasswordPage" is never referenced in any test file.
**Fix:** Add a test that exercises "ResetPasswordPage".

---

## 🟡 WARNING — Untested export
**File:** `src\app\api\health\route.ts:73`
**Issue:** Exported "HEAD" is never referenced in any test file.
**Fix:** Add a test that exercises "HEAD".

---

## 🟡 WARNING — Untested export
**File:** `src\app\api\mobile-order\rateLimiter.ts:7`
**Issue:** Exported "isRateLimited" is never referenced in any test file.
**Fix:** Add a test that exercises "isRateLimited".

---

## 🟡 WARNING — Untested export
**File:** `src\components\grid\hooks\useGridCallbacks.ts:18`
**Issue:** Exported "useGridCallbacks" is never referenced in any test file.
**Fix:** Add a test that exercises "useGridCallbacks".

---

## 🟡 WARNING — Untested export
**File:** `src\components\grid\hooks\useGridPerformance.ts:11`
**Issue:** Exported "useGridPerformance" is never referenced in any test file.
**Fix:** Add a test that exercises "useGridPerformance".

---

## 🟡 WARNING — Untested export
**File:** `src\hooks\queries\reports\useLostSalesReport.ts:21`
**Issue:** Exported "useLostSalesReport" is never referenced in any test file.
**Fix:** Add a test that exercises "useLostSalesReport".

---

# Config & Env

✅ No issues found
