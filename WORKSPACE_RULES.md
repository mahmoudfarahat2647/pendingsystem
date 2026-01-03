# Renault System - Workspace Development Rules

**Copy these rules to your AI assistant's memory for consistent development practices.**

---

## 1. Testing: REQUIRED Before Merge

```bash
# Every new feature MUST include tests
npm run test    # Must pass
npm run lint    # Zero errors
npm run build   # Must succeed
```

Test files required:
- Store slices → `src/test/{sliceName}.test.ts` (100% coverage)
- Services → `src/test/{serviceName}.test.ts` (90%+ coverage)
- Complex components → `src/test/{componentName}.test.tsx` (70%+ coverage)

---

## 2. Component Size: 250 Lines Maximum

If file exceeds 250 lines → Extract sub-components

```
src/components/{feature}/
├── MainComponent.tsx        (<100 lines)
├── SubComponentA.tsx
└── hooks/useFeatureLogic.ts
```

---

## 3. Imports: Absolute Paths Only

```typescript
// ✅ CORRECT
import { Component } from "@/components/grid";

// ❌ WRONG
import { Component } from "../../grid";
import { DataGrid } from "@/components/shared/DataGrid"; // Forbidden by Biome
```

---

## 4. State Management: Clear Separation

**Zustand** = UI preferences ONLY (statuses, templates, preferences)
**React Query** = ALL backend data (orders, Supabase queries)

```typescript
// ❌ NEVER store backend data in Zustand
// ✅ ALWAYS use React Query for Supabase
```

---

## 5. Error Handling: Required for All Operations

```typescript
// Wrap critical components
<ClientErrorBoundary fallbackTitle="Feature Error">
  <Component />
</ClientErrorBoundary>

// All mutations need user feedback
const mutation = useMutation({
  onError: (error) => toast.error(error.message),
  onSuccess: () => toast.success("Success")
});
```

---

## 6. Supabase: Service Layer Pattern

```typescript
// ✅ CORRECT: Service layer
// src/services/orderService.ts
export const orderService = {
  async getOrders(stage) { ... }
};

// ❌ WRONG: Direct Supabase in components
const Component = () => {
  await supabase.from('orders').select(); // NO!
};
```

---

## 7. Documentation: Update When Changing Core Logic

| Changed | Update File |
|---------|------------|
| Workflow stages | `docs/WORKFLOW_STATES.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Environment vars | `docs/ENVIRONMENT.md` |

**Code comments**: Explain WHY, not WHAT. Tag critical logic with `[CRITICAL]`

---

## 8. Performance: Optimize Heavy Components

```typescript
// Dynamic imports for large components
const DataGrid = dynamic(() => import('./DataGrid'));

// Memoize expensive calculations
const value = useMemo(() => calculate(), [deps]);

// Debounce search (300ms minimum)
const debounced = useDebouncedCallback(fn, 300);
```

**Targets**: First Load JS < 200 KB, Grid render < 100ms

---

## 9. Git Commits: Conventional Format

```
<type>: <description>

feat: Add warranty calculator
fix: Resolve grid rendering issue
refactor: Extract cell renderers
test: Add ordersSlice tests
docs: Update workflow documentation
```

---

## 10. Pre-Commit Checklist

```bash
☐ npm run lint   (pass)
☐ npm run test   (pass)
☐ npm run build  (succeed)
☐ git diff       (review changes)
☐ Update docs    (if needed)
☐ Clear commit message
```

---

## 11. Deployment Checklist

**Pre-Deploy**:
- ☐ All tests passing
- ☐ Zero lint errors
- ☐ Build succeeds
- ☐ Env vars documented
- ☐ No console.log in production

**Post-Deploy**:
- ☐ Smoke test critical flows
- ☐ Check browser console
- ☐ Verify Supabase connection

---

## 12. Code Review: Enforce Standards

**Auto-reject if**:
- Build fails
- Tests fail
- Linting errors
- No tests for new features
- Missing error handling
- File size > 250 lines

---

## 13. Accessibility: ARIA Labels Required

```tsx
// ✅ CORRECT
<button aria-label={`Action for ${item.name}`}>
  <Icon />
</button>

// ❌ WRONG
<button><Icon /></button>
```

All modals must use Shadcn `Dialog` (auto focus-trapping)

---

## Success Metrics (Monthly)

- ✅ Test coverage: 70%+
- ✅ Build time: < 30s
- ✅ Zero lint errors
- ✅ All components < 250 lines
- ✅ First Load JS: < 200 KB

**Last Updated**: January 3, 2026
