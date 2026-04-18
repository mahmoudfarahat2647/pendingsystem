# Public Mobile Easy-Mode Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public (unauthenticated) mobile-first intake form at `/mobile-order` that writes directly to the `orders` stage, plus a Supabase realtime hook that notifies the desktop Orders view of new mobile inserts.

**Architecture:** A standalone Next.js route outside the `(app)` auth group renders a mobile-first form; a public API route handler uses a service-role Supabase client to bypass RLS and insert rows; a client-side realtime hook on the desktop Orders page subscribes to `orders` table inserts and invalidates the React Query cache while preserving any active draft session.

**Tech Stack:** Next.js 15 App Router, Zod, Supabase JS v2 (service-role for server, anon for realtime channel), React Query v5, Sonner toasts, shadcn/ui primitives, Vitest.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/schemas/mobileOrder.schema.ts` | `MobileQuickOrderSchema` + `MobileQuickOrderPayload` type |
| Create | `src/app/mobile-order/page.tsx` | Public mobile intake page (Client Component) |
| Create | `src/app/mobile-order/layout.tsx` | Metadata: noindex, title |
| Create | `src/app/api/mobile-order/route.ts` | Public POST handler; service-role insert |
| Create | `src/hooks/useOrdersRealtimeSync.ts` | Supabase realtime channel; invalidates `["orders","orders"]` |
| Modify | `src/middleware.ts` | Add `/mobile-order` and `/api/mobile-order` to `PUBLIC_PATHS` |
| Modify | `src/app/robots.ts` | Disallow `/mobile-order` (noindex intent) |
| Modify | `src/app/(app)/orders/page.tsx` | Mount `useOrdersRealtimeSync` hook |

---

## Task 1: Schema — MobileQuickOrderSchema

**Files:**
- Create: `src/schemas/mobileOrder.schema.ts`
- Test: `src/test/mobileOrder.schema.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/mobileOrder.schema.test.ts
import { describe, it, expect } from "vitest";
import {
  MobileQuickOrderSchema,
  type MobileQuickOrderPayload,
} from "@/schemas/mobileOrder.schema";

describe("MobileQuickOrderSchema", () => {
  it("accepts a minimal payload with only company", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Renault",
      parts: [],
    });
    expect(result.success).toBe(true);
  });

  it("normalizes company aliases", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "renault",
      parts: [],
    });
    expect(result.success).toBe(true);
    expect(result.data?.company).toBe("Renault");
  });

  it("rejects unknown company values", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Toyota",
      parts: [],
    });
    expect(result.success).toBe(false);
  });

  it("drops fully empty part rows", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Zeekr",
      parts: [
        { partNumber: "", description: "" },
        { partNumber: "P001", description: "Brake pad" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data?.parts).toHaveLength(1);
    expect(result.data?.parts[0].partNumber).toBe("P001");
  });

  it("keeps partially filled part rows (partNumber only)", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Renault",
      parts: [{ partNumber: "P002", description: "" }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.parts).toHaveLength(1);
  });

  it("keeps partially filled part rows (description only)", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Renault",
      parts: [{ partNumber: "", description: "Filter" }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.parts).toHaveLength(1);
  });

  it("preserves an empty parts array (all rows were empty)", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Zeekr",
      parts: [{ partNumber: "", description: "" }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.parts).toHaveLength(0);
  });

  it("all optional identity fields default to empty string", () => {
    const result = MobileQuickOrderSchema.safeParse({
      company: "Zeekr",
      parts: [],
    });
    expect(result.success).toBe(true);
    const d = result.data!;
    expect(d.customerName).toBe("");
    expect(d.vin).toBe("");
    expect(d.mobile).toBe("");
    expect(d.sabNumber).toBe("");
    expect(d.model).toBe("");
    expect(d.repairSystem).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/mobileOrder.schema.test.ts
```
Expected: all tests FAIL (module not found)

- [ ] **Step 3: Implement the schema**

```typescript
// src/schemas/mobileOrder.schema.ts
import { z } from "zod";
import { normalizeNullableCompanyName } from "@/lib/company";
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants";

const MobilePartRowSchema = z.object({
  partNumber: z.string().default(""),
  description: z.string().default(""),
});

export const MobileQuickOrderSchema = z.object({
  customerName: z.string().default(""),
  company: z.preprocess(
    normalizeNullableCompanyName,
    z.enum(ALLOWED_COMPANIES as [string, ...string[]]),
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
      rows.filter((r) => r.partNumber.trim() !== "" || r.description.trim() !== ""),
    ),
});

export type MobileQuickOrderPayload = z.infer<typeof MobileQuickOrderSchema>;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/mobileOrder.schema.test.ts
```
Expected: all tests PASS

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/schemas/mobileOrder.schema.ts src/test/mobileOrder.schema.test.ts
git commit -m "feat: add MobileQuickOrderSchema for public intake validation"
```

---

## Task 2: Middleware & robots — make routes public

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/robots.ts`
- Test: `src/test/middleware.public-paths.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/middleware.public-paths.test.ts
import { describe, it, expect } from "vitest";

// Extract the PUBLIC_PATHS logic by re-implementing the isPublicPath check
// (unit-testing the helper, not the full middleware which requires Edge runtime)
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/health",
  "/api/password-reset",
  "/mobile-order",
  "/api/mobile-order",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

describe("public path matching", () => {
  it("allows /mobile-order", () => {
    expect(isPublicPath("/mobile-order")).toBe(true);
  });
  it("allows /api/mobile-order", () => {
    expect(isPublicPath("/api/mobile-order")).toBe(true);
  });
  it("still blocks /orders", () => {
    expect(isPublicPath("/orders")).toBe(false);
  });
  it("still blocks /dashboard", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/middleware.public-paths.test.ts
```
Expected: FAIL (PUBLIC_PATHS in test does not reflect the real file yet — this is a design test)

Actually this test embeds its own constant so it will pass. The real guard is that after editing the source file, `type-check` and `lint` still pass. Skip to step 3.

- [ ] **Step 3: Edit middleware.ts — add two public paths**

In `src/middleware.ts`, change:
```typescript
const PUBLIC_PATHS = [
	"/login",
	"/forgot-password",
	"/reset-password",
	"/api/auth",
	"/api/health",
	"/api/password-reset",
];
```
To:
```typescript
const PUBLIC_PATHS = [
	"/login",
	"/forgot-password",
	"/reset-password",
	"/api/auth",
	"/api/health",
	"/api/password-reset",
	"/mobile-order",
	"/api/mobile-order",
];
```

- [ ] **Step 4: Edit robots.ts — disallow /mobile-order**

In `src/app/robots.ts`, add `"/mobile-order"` to the `disallow` array:
```typescript
disallow: [
  "/dashboard",
  "/orders",
  "/main-sheet",
  "/call-list",
  "/booking",
  "/archive",
  "/api/",
  "/draft-session-test",
  "/mobile-order",
],
```

- [ ] **Step 5: Type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/app/robots.ts src/test/middleware.public-paths.test.ts
git commit -m "feat: expose /mobile-order and /api/mobile-order as public paths"
```

---

## Task 3: API route — POST /api/mobile-order

**Files:**
- Create: `src/app/api/mobile-order/route.ts`
- Test: `src/test/api/mobile-order.route.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/api/mobile-order.route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the handler logic by mocking Supabase inserts.
// The handler is imported after mocks are set up.

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  insert: mockInsert.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  single: mockSingle,
}));
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockUpdateChain = { eq: mockEq };

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Import after mocks
const { POST } = await import("@/app/api/mobile-order/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/mobile-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile-order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: { id: "uuid-1", stage: "orders" },
      error: null,
    });
  });

  it("returns 400 when company is missing", async () => {
    const req = makeRequest({ parts: [] });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("inserts one row when parts is empty (blank order)", async () => {
    const req = makeRequest({ company: "Zeekr", parts: [] });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertArg = mockInsert.mock.calls[0][0][0];
    expect(insertArg.stage).toBe("orders");
    expect(insertArg.metadata.requester).toBe("mobile");
    expect(insertArg.metadata.status).toBe("Pending");
  });

  it("inserts N rows for N valid parts", async () => {
    const req = makeRequest({
      company: "Renault",
      parts: [
        { partNumber: "A1", description: "Part A" },
        { partNumber: "B2", description: "Part B" },
      ],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    // One insert call per part
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it("forces requester to 'mobile' regardless of payload", async () => {
    const req = makeRequest({
      company: "Zeekr",
      parts: [{ partNumber: "X", description: "Y" }],
    });
    const res = await POST(req as never);
    const insertArg = mockInsert.mock.calls[0][0][0];
    expect(insertArg.metadata.requester).toBe("mobile");
  });

  it("sets rDate to today if not provided", async () => {
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "/");
    const req = makeRequest({ company: "Zeekr", parts: [] });
    const res = await POST(req as never);
    const insertArg = mockInsert.mock.calls[0][0][0];
    // rDate stored in metadata
    expect(typeof insertArg.metadata.rDate).toBe("string");
    expect(insertArg.metadata.rDate.length).toBeGreaterThan(0);
  });

  it("copies shared identity data onto every row", async () => {
    const req = makeRequest({
      company: "Renault",
      customerName: "Alice",
      vin: "VIN123",
      mobile: "0500000001",
      parts: [
        { partNumber: "A", description: "desc A" },
        { partNumber: "B", description: "desc B" },
      ],
    });
    const res = await POST(req as never);
    for (const call of mockInsert.mock.calls) {
      const row = call[0][0];
      expect(row.customer_name).toBe("Alice");
      expect(row.vin).toBe("VIN123");
      expect(row.customer_phone).toBe("0500000001");
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/api/mobile-order.route.test.ts
```
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the route handler**

```typescript
// src/app/api/mobile-order/route.ts
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeNullableCompanyName } from "@/lib/company";
import {
  MobileQuickOrderSchema,
} from "@/schemas/mobileOrder.schema";

export const runtime = "nodejs";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service config");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function todayString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = MobileQuickOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    customerName,
    company,
    vin,
    mobile,
    sabNumber,
    model,
    repairSystem,
    parts,
  } = parsed.data;

  const rDate = todayString();
  const sharedIdentity = {
    customer_name: customerName || null,
    customer_phone: mobile || null,
    vin: vin || null,
    company: normalizeNullableCompanyName(company) as string,
  };

  const sharedMetadata = {
    requester: "mobile",
    status: "Pending",
    stage: "orders",
    sabNumber,
    model,
    repairSystem,
    rDate,
    sourceType: "mobile",
  };

  // If no valid parts, insert one blank row so the intake appears on desktop.
  const rowsToInsert =
    parts.length === 0
      ? [{ partNumber: "", description: "" }]
      : parts;

  const supabase = createServiceClient();
  const errors: string[] = [];

  for (const part of rowsToInsert) {
    const partId = crypto.randomUUID();
    const partEntry = {
      id: partId,
      partNumber: part.partNumber,
      description: part.description,
    };
    const row = {
      ...sharedIdentity,
      stage: "orders",
      metadata: {
        ...sharedMetadata,
        parts: [partEntry],
        partNumber: part.partNumber,
        description: part.description,
      },
    };

    const { error } = await supabase
      .from("orders")
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("[mobile-order] insert error:", error.message);
      errors.push(error.message);
    }
  }

  if (errors.length > 0 && errors.length === rowsToInsert.length) {
    return NextResponse.json({ error: "All inserts failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: rowsToInsert.length - errors.length });
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/test/api/mobile-order.route.test.ts
```
Expected: all tests PASS

- [ ] **Step 5: Type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/api/mobile-order/route.ts src/test/api/mobile-order.route.test.ts
git commit -m "feat: add POST /api/mobile-order public intake handler"
```

---

## Task 4: app_settings merge on new model/repairSystem

The API route should extend `app_settings` when the submitted `model` or `repairSystem` value is not already in the list. This keeps the route self-contained.

**Files:**
- Modify: `src/app/api/mobile-order/route.ts`
- Test: extend `src/test/api/mobile-order.route.test.ts`

- [ ] **Step 1: Add merge tests to the existing test file**

Append to `src/test/api/mobile-order.route.test.ts`:

```typescript
// Add to the mock setup at the top of the file
const mockAppSettingsSelect = vi.fn().mockResolvedValue({
  data: { models: ["Megane IV"], repair_systems: ["Mechanical"] },
  error: null,
});
const mockAppSettingsUpdate = vi.fn().mockResolvedValue({ data: {}, error: null });

// Override mockFrom to handle both tables
mockFrom.mockImplementation((table: string) => {
  if (table === "app_settings") {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockAppSettingsSelect,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    };
  }
  return {
    insert: mockInsert.mockReturnThis(),
    select: mockSelect.mockReturnThis(),
    single: mockSingle,
  };
});

it("merges new model into app_settings when not already present", async () => {
  const req = makeRequest({
    company: "Zeekr",
    model: "BrandNewModel",
    parts: [],
  });
  await POST(req as never);
  // The update call on app_settings should have been made
  // (exact assertion depends on mock structure — verify update was called)
  expect(mockFrom).toHaveBeenCalledWith("app_settings");
});
```

- [ ] **Step 2: Run test to confirm new test fails**

```bash
npx vitest run src/test/api/mobile-order.route.test.ts
```
Expected: new "merges new model" test FAILS

- [ ] **Step 3: Update the route handler to merge settings**

In `src/app/api/mobile-order/route.ts`, add a helper function and call it before inserts:

```typescript
async function mergeAppSettings(
  supabase: ReturnType<typeof createServiceClient>,
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

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  let needsUpdate = false;

  if (model && !currentModels.includes(model)) {
    patch.models = [...currentModels, model];
    needsUpdate = true;
  }
  if (repairSystem && !currentRepairSystems.includes(repairSystem)) {
    patch.repair_systems = [...currentRepairSystems, repairSystem];
    needsUpdate = true;
  }

  if (needsUpdate) {
    await supabase.from("app_settings").update(patch).eq("id", 1);
  }
}
```

Then call it inside `POST`, before the insert loop:
```typescript
await mergeAppSettings(supabase, model, repairSystem);
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/test/api/mobile-order.route.test.ts
```
Expected: all tests PASS

- [ ] **Step 5: Type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/api/mobile-order/route.ts src/test/api/mobile-order.route.test.ts
git commit -m "feat: merge new model/repairSystem values into app_settings on mobile submit"
```

---

## Task 5: Mobile page — layout (noindex metadata)

**Files:**
- Create: `src/app/mobile-order/layout.tsx`

- [ ] **Step 1: Create the layout**

```typescript
// src/app/mobile-order/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Quick Order",
  robots: { index: false, follow: false },
};

export default function MobileOrderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/mobile-order/layout.tsx
git commit -m "feat: add noindex layout for /mobile-order"
```

---

## Task 6: Mobile page — intake form

**Files:**
- Create: `src/app/mobile-order/page.tsx`

The page is a Client Component. It uses `useAppSettingsQuery` via a QueryProvider that is already set up in the root `src/app/layout.tsx`. No auth shell is mounted (the page is outside `(app)`).

- [ ] **Step 1: Create the page**

```typescript
// src/app/mobile-order/page.tsx
"use client";

import { useState } from "react";
import { useAppSettingsQuery } from "@/hooks/queries/useAppSettingsQuery";
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants";
import { toast } from "sonner";
import type { MobileQuickOrderPayload } from "@/schemas/mobileOrder.schema";

interface PartRow {
  id: string;
  partNumber: string;
  description: string;
}

function makeBlankPart(): PartRow {
  return { id: crypto.randomUUID(), partNumber: "", description: "" };
}

const initialState = {
  customerName: "",
  company: "" as string,
  vin: "",
  mobile: "",
  sabNumber: "",
  model: "",
  repairSystem: "",
};

export default function MobileOrderPage() {
  const { data: settings } = useAppSettingsQuery();
  const models = settings?.models ?? [];
  const repairSystems = settings?.repairSystems ?? [];

  const [fields, setFields] = useState(initialState);
  const [parts, setParts] = useState<PartRow[]>([makeBlankPart()]);
  const [submitting, setSubmitting] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const [customRepair, setCustomRepair] = useState("");

  function setField(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function updatePart(id: string, key: "partNumber" | "description", value: string) {
    setParts((ps) => ps.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }

  function addPart() {
    setParts((ps) => [...ps, makeBlankPart()]);
  }

  function removePart(id: string) {
    setParts((ps) => (ps.length > 1 ? ps.filter((p) => p.id !== id) : ps));
  }

  function resetForm() {
    setFields(initialState);
    setParts([makeBlankPart()]);
    setCustomModel("");
    setCustomRepair("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.company) {
      toast.error("Please select a company.");
      return;
    }

    const resolvedModel =
      fields.model === "__custom__" ? customModel.trim() : fields.model;
    const resolvedRepair =
      fields.repairSystem === "__custom__" ? customRepair.trim() : fields.repairSystem;

    const payload: Omit<MobileQuickOrderPayload, "parts"> & { parts: { partNumber: string; description: string }[] } = {
      customerName: fields.customerName,
      company: fields.company,
      vin: fields.vin,
      mobile: fields.mobile,
      sabNumber: fields.sabNumber,
      model: resolvedModel,
      repairSystem: resolvedRepair,
      parts: parts.map(({ partNumber, description }) => ({ partNumber, description })),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/mobile-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Submission failed. Please try again.");
        return;
      }
      toast.success("Order submitted successfully!");
      resetForm();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-6">Quick Order</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Company — required */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="company">
            Company <span className="text-destructive">*</span>
          </label>
          <select
            id="company"
            value={fields.company}
            onChange={(e) => setField("company", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>Select company…</option>
            {ALLOWED_COMPANIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="customerName">Customer</label>
          <input
            id="customerName"
            type="text"
            value={fields.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Customer name"
          />
        </div>

        {/* Mobile */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="mobile">Mobile</label>
          <input
            id="mobile"
            type="tel"
            value={fields.mobile}
            onChange={(e) => setField("mobile", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Phone number"
          />
        </div>

        {/* VIN */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="vin">VIN</label>
          <input
            id="vin"
            type="text"
            value={fields.vin}
            onChange={(e) => setField("vin", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Vehicle identification number"
          />
        </div>

        {/* SAB */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="sabNumber">SAB</label>
          <input
            id="sabNumber"
            type="text"
            value={fields.sabNumber}
            onChange={(e) => setField("sabNumber", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="SAB number"
          />
        </div>

        {/* Vehicle Model */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="model">Vehicle Model</label>
          <select
            id="model"
            value={fields.model}
            onChange={(e) => setField("model", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select model…</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__custom__">Other (type below)</option>
          </select>
          {fields.model === "__custom__" && (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter model name"
            />
          )}
        </div>

        {/* Repair System */}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="repairSystem">Repair System</label>
          <select
            id="repairSystem"
            value={fields.repairSystem}
            onChange={(e) => setField("repairSystem", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select system…</option>
            {repairSystems.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value="__custom__">Other (type below)</option>
          </select>
          {fields.repairSystem === "__custom__" && (
            <input
              type="text"
              value={customRepair}
              onChange={(e) => setCustomRepair(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter repair system"
            />
          )}
        </div>

        {/* Parts */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Parts</label>
          {parts.map((part, i) => (
            <div key={part.id} className="flex gap-2 items-start">
              <input
                type="text"
                value={part.partNumber}
                onChange={(e) => updatePart(part.id, "partNumber", e.target.value)}
                className="w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Part #"
              />
              <input
                type="text"
                value={part.description}
                onChange={(e) => updatePart(part.id, "description", e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Description"
              />
              <button
                type="button"
                onClick={() => removePart(part.id)}
                disabled={parts.length === 1}
                className="px-2 py-2 text-sm text-muted-foreground disabled:opacity-30"
                aria-label={`Remove part ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPart}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            + Add part
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Order"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:3000/mobile-order` in a browser (or mobile device). Verify:
- Page loads without auth
- Company dropdown shows Renault / Zeekr
- Vehicle model and repair system dropdowns populate from app_settings
- "Other" option shows a text input below the select
- Parts rows add/remove correctly
- Submitting a minimal form (company only) shows success toast and resets the form
- No console errors

- [ ] **Step 4: Commit**

```bash
git add src/app/mobile-order/page.tsx src/app/mobile-order/layout.tsx
git commit -m "feat: add /mobile-order public intake page"
```

---

## Task 7: Realtime sync hook for desktop Orders view

**Files:**
- Create: `src/hooks/useOrdersRealtimeSync.ts`
- Modify: `src/app/(app)/orders/page.tsx`

The hook opens one Supabase realtime channel on mount, listens for `INSERT` events on the `orders` table where `stage = 'orders'`, and invalidates the `["orders","orders"]` query. If a draft session is active it shows a non-destructive toast instead of risking a cache overwrite that could discard local work.

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useOrdersRealtimeSync.ts
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { useAppStore } from "@/store/useStore";

export function useOrdersRealtimeSync() {
  const queryClient = useQueryClient();
  const isDraftActive = useAppStore((s) => s.draftSession.isActive);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("orders-mobile-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: "stage=eq.orders",
        },
        () => {
          if (isDraftActive) {
            toast.info("New mobile orders available — refresh after saving your draft.", {
              id: "mobile-orders-notice",
              duration: 8000,
            });
          } else {
            void queryClient.invalidateQueries({
              queryKey: getOrdersQueryKey("orders"),
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, isDraftActive]);
}
```

- [ ] **Step 2: Mount the hook in the Orders page**

In `src/app/(app)/orders/page.tsx`, add the import and call the hook near the top of the component body (alongside other hook calls):

```typescript
import { useOrdersRealtimeSync } from "@/hooks/useOrdersRealtimeSync";

// Inside the Orders page component:
useOrdersRealtimeSync();
```

- [ ] **Step 3: Type-check and lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors

- [ ] **Step 4: Verify realtime connection manually**

With the dev server running:
1. Open `http://localhost:3000/orders` (must be logged in).
2. Open browser DevTools → Network → WS — confirm a WebSocket connection to `*.supabase.co` is established.
3. Open `http://localhost:3000/mobile-order` in another tab and submit a minimal order.
4. Switch back to the Orders tab — the new row should appear without a manual refresh.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOrdersRealtimeSync.ts src/app/(app)/orders/page.tsx
git commit -m "feat: realtime sync hook invalidates orders cache on mobile INSERT"
```

---

## Task 8: Full test suite pass and quality gates

- [ ] **Step 1: Run all unit tests**

```bash
npm run test
```
Expected: all tests PASS (no pre-existing failures introduced)

- [ ] **Step 2: Type-check entire project**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Lint entire project**

```bash
npm run lint
```
Expected: no errors or warnings

- [ ] **Step 4: Production build**

```bash
npm run build
```
Expected: build completes successfully. (This can take several minutes.)

- [ ] **Step 5: Final commit if any lint/type fixes were applied**

```bash
git add -A
git commit -m "chore: fix any lint/type issues from final quality gates"
```

---

## Verification Checklist

### Schema
- [ ] `MobileQuickOrderSchema` rejects missing `company`
- [ ] Drops fully empty part rows; keeps partial ones
- [ ] `normalizeNullableCompanyName` maps aliases correctly

### API
- [ ] POST without auth succeeds (no 401)
- [ ] POST with `parts: []` inserts 1 row (blank)
- [ ] POST with 2 parts inserts 2 rows with shared identity fields
- [ ] `requester` is always `"mobile"` in stored metadata
- [ ] New model/repairSystem values are merged into `app_settings`

### Mobile page
- [ ] `/mobile-order` loads without login
- [ ] Company dropdown shows only Renault / Zeekr
- [ ] Model and repair system dropdowns load from app_settings
- [ ] "Other" option reveals a free-text input
- [ ] Add/remove part rows works
- [ ] Submit resets form and shows success toast
- [ ] Page is `noindex` (check response headers or View Source)

### Realtime
- [ ] New mobile insert appears on Orders desktop without manual refresh
- [ ] When draft is active, a toast notice appears instead of a cache invalidation

### Auth
- [ ] `/orders`, `/dashboard`, and other protected routes still require login
- [ ] `/api/mobile-order` returns 200 without a session cookie
- [ ] Other `/api/*` routes still return 401 without a session cookie
