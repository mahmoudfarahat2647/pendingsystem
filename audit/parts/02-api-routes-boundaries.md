# Audit Report: A02: API Routes & Server Boundaries

This report contains findings from the codebase audit of the API routes (`src/app/api/**`) and server boundaries in the "pendingsystem" project.

---

### [A02-01] Unbounded Rate-Limiting Database Inserts on Blocked Requests
- **Severity**: High
- **Category**: Security
- **Location**: `supabase/migrations/20260516_rate_limits_fix.sql:21` (check_rate_limit function)
- **Evidence**:
  ```sql
  CREATE OR REPLACE FUNCTION check_rate_limit(
    p_ip           TEXT,
    p_max_requests INTEGER
  ) RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE v_count INTEGER;
  BEGIN
    DELETE FROM rate_limits
      WHERE requested_at < now() - interval '1 hour';

    INSERT INTO rate_limits (ip) VALUES (p_ip);

    SELECT COUNT(*) INTO v_count
      FROM rate_limits
     WHERE ip = p_ip
       AND requested_at >= now() - interval '1 hour';

    RETURN v_count > p_max_requests;
  END;
  $$;
  ```
- **Why it's real**: Every request to the public endpoints `/api/mobile-order` and `/api/password-reset/request` triggers the `check_rate_limit` RPC. When a client has exceeded the rate limit (e.g., 30 requests/hour), the function *still* inserts a new row into the `rate_limits` table before returning `true`. An attacker spamming the endpoint can insert millions of rows into the database, bypassing the space limit and causing database storage and memory exhaustion (Denial of Service).
- **Recommendation**: Check the current count of requests for that IP first. If the count is already `>= p_max_requests`, return `true` immediately without executing the `INSERT`.
- **Confidence**: High

---

### [A02-02] Lack of Input Length & Array Bounds Validation in Public Mobile Intake
- **Severity**: High
- **Category**: Security
- **Location**: `src/schemas/mobileOrder.schema.ts:10` (MobileQuickOrderSchema)
- **Evidence**:
  ```ts
  export const MobileQuickOrderSchema = z.object({
  	customerName: z.string().default(""),
  	company: z.preprocess(
  		normalizeNullableCompanyName,
  		z.enum([...ALLOWED_COMPANIES] as [string, ...string[]]),
  	),
  	vin: z.string().default(""),
  	mobile: z.string().default(""),
  	sabNumber: z.string().default(""),
  	model: z.string().default(""),
  	repairSystem: z.string().default(""),
  	parts: z
  		.array(MobilePartRowSchema)
  		.default([])
  		.transform((rows) =>
  			rows.filter(
  				(r) => r.partNumber.trim() !== "" || r.description.trim() !== "",
  			),
  		),
  });
  ```
- **Why it's real**: The endpoint `/api/mobile-order` is public and unauthenticated. The Zod schema `MobileQuickOrderSchema` does not specify any limits on the lengths of string fields (`customerName`, `vin`, `model`, etc.) or the size of the `parts` array. An attacker could send a payload with a `parts` array containing 10,000 items, causing `mobileOrderService.createOrders` to execute 10,000 parallel database inserts via `Promise.allSettled(rowsToInsert.map(...))`, which will exhaust the database connection pool and crash the application server.
- **Recommendation**: Restrict string lengths (e.g., `z.string().max(100)`) and define a maximum array length (e.g., `.max(20)`) for `parts`.
- **Confidence**: High

---

### [A02-03] Race Conditions and DB Bloat in Mobile Order App Settings Merging
- **Severity**: Medium
- **Category**: Correctness/Bug
- **Location**: `src/services/mobileOrderService.ts:14` (mergeAppSettings function)
- **Evidence**:
  ```ts
  async function mergeAppSettings(
  	supabase: SupabaseClient,
  	model: string,
  	repairSystem: string,
  ): Promise<void> {
  	const { data, error } = await supabase
  		.from("app_settings")
  		.select("models, repair_systems")
  		.eq("id", 1)
  		.single();

  	if (error || !data) return;

  	const currentModels: string[] = data.models ?? [];
  	const currentRepairSystems: string[] = data.repair_systems ?? [];
  ...
  	if (needsUpdate) {
  		await supabase.from("app_settings").update(patch).eq("id", 1);
  	}
  }
  ```
- **Why it's real**: When multiple mobile orders are submitted simultaneously, they read the same stale state of `app_settings` and attempt to update it. If two concurrent requests try to add different models, one update will overwrite the other (lost update). Additionally, because this endpoint is public and unauthenticated, anyone can submit custom `model` and `repairSystem` values, polluting the global application settings with arbitrary text.
- **Recommendation**: Perform settings validation and merge atomically using a database RPC/transaction (e.g., using `array_append` or similar PostgreSQL array functions directly in the DB) or restrict settings merging to authenticated users.
- **Confidence**: High

---

### [A02-04] Architectural Boundary Violations in Route Handlers
- **Severity**: Medium
- **Category**: Architecture
- **Location**: `src/app/api/app-settings/route.ts:43` and `src/app/api/health/route.ts:38`
- **Evidence**:
  In `app-settings/route.ts`:
  ```ts
  const supabase = createServiceClient();
  const { data, error } = await supabase
      .from("app_settings")
      .update(updatePayload)
      .eq("id", 1)
      .select("models, repair_systems, requesters")
      .single();
  ```
  In `health/route.ts`:
  ```ts
  await pool.query("SELECT 1");
  ```
- **Why it's real**: Business logic and database operations are executed directly inside the route handlers instead of being encapsulated in service functions. This violates the server boundary guidelines: "does every handler restrict its actions to `parse -> authorize -> service.call() -> respond`?" and "Look for inline SQL, direct database pool queries, or raw Kysely usage inside handlers."
- **Recommendation**: Refactor the database operations into service methods inside `appSettingsService` and a database utility or service for the health check.
- **Confidence**: High

---

### [A02-05] Route Files Exceeding the 50 Lines of Code Limit
- **Severity**: Low
- **Category**: Architecture
- **Location**: Multiple API route files (e.g. `src/app/api/app-settings/route.ts`, `src/app/api/health/route.ts`, `src/app/api/quick-templates/route.ts`, etc.)
- **Evidence**:
  - `src/app/api/app-settings/route.ts` (62 lines)
  - `src/app/api/health/route.ts` (76 lines)
  - `src/app/api/mobile-order/route.ts` (51 lines)
  - `src/app/api/password-reset/request/route.ts` (59 lines)
  - `src/app/api/quick-templates/route.ts` (90 lines)
  - `src/app/api/storage-stats/route.ts` (53 lines)
- **Why it's real**: These files exceed the strict limit of 50 lines of code per route file defined in the architectural checklist.
- **Recommendation**: Extract schemas, helper functions, and logic to separate service/utility files. For route files with multiple methods (e.g. GET/POST/DELETE in `quick-templates`), delegate all core logic to service functions to keep the handlers minimal.
- **Confidence**: High

---

### [A02-06] Potential PII/Sensitive Data Leak in Error Logging
- **Severity**: Low
- **Category**: Security
- **Location**: `src/services/passwordResetService.ts:33`
- **Evidence**:
  ```ts
  logger.error("Password reset email dispatch failed", {
      username,
      email,
      error: error instanceof Error ? error.message : String(error),
  });
  ```
- **Why it's real**: If the password reset email dispatch fails, the service logs the plain `username` and `email` alongside the error. This leaks Personally Identifiable Information (PII) into the application logs.
- **Recommendation**: Avoid logging plain emails and usernames in error logs, or mask them (e.g., `u***e@domain.com`).
- **Confidence**: High
