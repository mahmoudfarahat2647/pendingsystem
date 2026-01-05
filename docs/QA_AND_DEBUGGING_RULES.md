# Quality Assurance & Debugging Rules

**Comprehensive guidelines for code quality, testing, error handling, logging, review processes, performance, regression prevention, and production monitoring.**

---

## 1. Code Standards & Quality Gates

### 1.1 Pre-Commit Code Quality

**Required before every commit:**

```bash
npm run lint    # Zero errors/warnings
npm run build   # Must succeed without errors
npm run test    # All tests pass
```

**Enforcement:**
- Use Git pre-commit hooks (Husky is configured) to enforce these automatically
- Never force-push to `main` or `develop` branches
- All commits must reference an issue/ticket

### 1.2 TypeScript & Type Safety

- **No `any` types** - Use `unknown` and type-guard, or explicit interfaces
  - Exception: Third-party library types that force `any` (document with `@ts-expect-error`)
- **Strict mode enabled** - `tsconfig.json` must have `"strict": true`
- **Interface over `type` for exports** - Use `interface` for public APIs
- **Generics for reusable logic** - Avoid duplication with proper generic constraints

```typescript
// ✅ CORRECT
interface ApiResponse<T> {
  data: T;
  success: boolean;
}

// ❌ WRONG
type ApiResponse = any; // NO!
```

### 1.3 Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `OrderFormModal.tsx` |
| Hooks | `use` prefix, camelCase | `useOrdersPageHandlers.ts` |
| Services | camelCase, no `Service` suffix | `orderService.ts` |
| Store slices | Descriptive, camelCase | `ordersSlice.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_GRID_SIZE = 1000` |
| Boolean functions/vars | `is/has/should` prefix | `isLoading`, `hasError` |
| Private functions | `_` prefix in utils | `_sanitizeInput()` |

### 1.4 Function Complexity & Size Limits

- **Functions**: Max 30 lines of logic (excluding braces, imports)
- **Components**: Max 250 lines (includes JSX and hooks)
- **Cyclomatic Complexity**: Max 4 branches per function
- **Parameters**: Max 3 parameters (use object destructuring for 4+)

**Action**: If exceeded → Extract sub-functions or sub-components immediately.

### 1.5 Import Organization

```typescript
// ✅ CORRECT ORDER
// 1. External dependencies
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

// 2. Absolute imports from project
import { orderService } from '@/services/orderService';
import { useOrderStore } from '@/store/slices/ordersSlice';

// 3. Local imports (same folder)
import { HelperComponent } from './HelperComponent';

// ❌ WRONG
import { Component } from '../../utils';  // Relative imports forbidden
import DataGrid from '@/components/shared/DataGrid';  // Use @/components/grid
```

---

## 2. Testing Practices

### 2.1 Test Coverage Requirements

| Code Category | Minimum Coverage | Tool |
|---|---|---|
| Store slices (Zustand) | **100%** | Vitest |
| Services (API/Supabase) | **90%+** | Vitest |
| Complex custom hooks | **85%+** | Vitest |
| Utility functions | **80%+** | Vitest |
| Complex components (>100 LOC) | **70%+** | Vitest + React Testing Library |
| Simple UI components | **50%+** | Vitest + React Testing Library |
| End-to-end workflows | **100%** | Playwright |

### 2.2 Unit Test Structure

**Test file location and naming:**

```
Feature Folder:
├── Component.tsx
├── useHook.ts
└── __tests__/
    ├── Component.test.tsx
    ├── useHook.test.ts
    └── fixtures/
        └── mockData.ts
```

**Test template:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('OrderFormModal', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test: Happy path
  it('should submit form with valid data', async () => {
    // Arrange
    const mockOnSubmit = vi.fn();
    render(<OrderFormModal onSubmit={mockOnSubmit} />);

    // Act
    await userEvent.type(screen.getByLabelText('Order ID'), '12345');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      orderId: '12345'
    }));
  });

  // Test: Error path
  it('should show error when submission fails', async () => {
    // Test error handling
  });

  // Test: Edge case
  it('should handle empty input gracefully', async () => {
    // Test boundary condition
  });
});
```

### 2.3 Mutation Testing

- **React Query mutations** must test both `onSuccess` and `onError` callbacks
- **Zustand store updates** must verify state immutability
- **Async operations** must test loading, success, and error states

```typescript
// ✅ CORRECT: Test mutation lifecycle
it('should update loading state during mutation', async () => {
  const { result } = renderHook(() => useMutation({
    mutationFn: async () => { /* ... */ },
    onError: (error) => { /* ... */ }
  }));

  expect(result.current.isPending).toBe(true);
  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
  });
});
```

### 2.4 End-to-End (E2E) Tests

**Run before merging to main:**

```bash
npm run e2e           # All E2E tests
npm run e2e:debug     # Debug specific test
npm run e2e:ui        # Watch mode
```

**Critical user journeys to test:**

1. User login → Dashboard navigation
2. Create order → Submit → Confirmation
3. Booking calendar interaction → Save dates
4. Archive workflow → Reason selection
5. Search/filter → Results validation
6. Export data → File download

**Playwright test template:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
  });

  test('should create and save a new order', async ({ page }) => {
    // Use role-based locators
    await page.getByRole('button', { name: /new order/i }).click();
    await page.getByLabel(/order id/i).fill('ORD-001');
    
    // Auto-wait for element, no timeouts
    await page.getByRole('button', { name: /save/i }).click();
    
    // Assert success
    await expect(page.getByRole('status')).toContainText('Order saved');
  });
});
```

### 2.5 Test Execution & CI/CD

- **Local**: `npm run test` before each commit
- **Pre-merge**: GitHub Actions must pass all checks:
  - Linting (`npm run lint`)
  - Build (`npm run build`)
  - Unit tests (`npm run test`)
  - E2E tests (`npm run e2e`)
- **Flaky tests**: Quarantine and fix immediately; document reason in test comments

---

## 3. Error Handling

### 3.1 Error Boundaries

**Every feature must use error boundaries:**

```typescript
// ✅ CORRECT: Wrap at component boundary
import { ClientErrorBoundary } from '@/components/shared/ClientErrorBoundary';

export function OrdersPage() {
  return (
    <ClientErrorBoundary fallbackTitle="Orders Error">
      <OrdersGrid />
      <OrdersToolbar />
    </ClientErrorBoundary>
  );
}
```

**Error boundary requirements:**
- Display user-friendly error message (not stack trace)
- Provide recovery action (reload, go back, contact support)
- Log error to monitoring service (see Section 6)
- Never show raw exception details in production

### 3.2 API Error Handling

**All Supabase/API calls must handle errors:**

```typescript
// ✅ CORRECT: Service layer with error handling
export const orderService = {
  async getOrders(stage: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('stage', stage);

      if (error) {
        // Log with context
        console.error('[orderService.getOrders]', {
          stage,
          error: error.message,
          code: error.code
        });
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      return data;
    } catch (err) {
      // Re-throw with additional context
      throw {
        message: 'Unable to load orders',
        originalError: err,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// ✅ CORRECT: React Query with error callback
const { data, isError, error } = useQuery({
  queryKey: ['orders', stage],
  queryFn: () => orderService.getOrders(stage),
  retry: 2,  // Retry failed requests
  staleTime: 5 * 60 * 1000  // 5 minutes
});

if (isError) {
  return <ErrorDisplay error={error} onRetry={refetch} />;
}
```

### 3.3 Form & Input Validation

**All user inputs must be validated:**

```typescript
// ✅ CORRECT: Schema-based validation
import { z } from 'zod';

const orderSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  stage: z.enum(['booking', 'main', 'archive']),
  quantity: z.number().int().positive('Quantity must be positive')
});

// In component
const form = useForm({
  resolver: zodResolver(orderSchema),
  defaultValues: { ... }
});

// Validation runs on submit, show inline errors
<input {...form.register('orderId')} />
{form.formState.errors.orderId && (
  <span role="alert">{form.formState.errors.orderId.message}</span>
)}
```

### 3.4 Async Operation Error Handling

```typescript
// ✅ CORRECT: Handle all async paths
const mutation = useMutation({
  mutationFn: orderService.createOrder,
  
  onError: (error) => {
    // Log error
    console.error('Order creation failed:', error);
    
    // Show user-friendly message
    toast.error('Could not create order. Please try again.');
    
    // Track for monitoring
    trackEvent('order_creation_failed', {
      errorCode: error.code,
      timestamp: new Date().toISOString()
    });
  },
  
  onSuccess: (data) => {
    toast.success('Order created successfully');
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
  
  onSettled: () => {
    // Cleanup (runs regardless of success/failure)
    setIsProcessing(false);
  }
});
```

---

## 4. Logging & Observability

### 4.1 Logging Standards

**Log levels by severity:**

| Level | When to Use | Example |
|-------|-----------|---------|
| **ERROR** | Critical failures, API errors | Service layer exceptions, auth failures |
| **WARN** | Potential issues, deprecations | Retry attempt #2, unusual state |
| **INFO** | Important business events | User login, order created |
| **DEBUG** | Development-only details | Component mount, state changes |

### 4.2 Structured Logging

**Always log with context object:**

```typescript
// ✅ CORRECT: Structured logs with context
console.error('[orderService.createOrder]', {
  userId: currentUser.id,
  orderId: orderData.id,
  stage: 'main',
  error: error.message,
  errorCode: error.code,
  timestamp: new Date().toISOString(),
  duration: Date.now() - startTime  // ms
});

console.info('[workflow]', {
  action: 'stage_changed',
  fromStage: 'booking',
  toStage: 'main',
  orderId: 'ORD-12345',
  userId: 'user-001',
  timestamp: new Date().toISOString()
});

// ❌ WRONG: Vague logs
console.log('Error!');  // No context
console.error(err);     // Stack trace only
```

### 4.3 Sensitive Data: Never Log

**FORBIDDEN to log:**
- Authentication tokens / API keys
- Passwords, PINs, security questions
- Personal data (SSN, DOB, phone numbers)
- Payment card numbers
- Any data subject to GDPR/privacy regulations

```typescript
// ❌ WRONG
console.log('Auth token:', authToken);  // NEVER!

// ✅ CORRECT: Log identifiers only
console.info('[auth]', {
  userId: user.id,
  email: user.email,  // OK if needed for audit
  action: 'login_success'
});
```

### 4.4 Performance Logging

**Measure critical operations:**

```typescript
// ✅ CORRECT: Performance timing
const startTime = performance.now();

try {
  const result = await expensiveOperation();
  const duration = performance.now() - startTime;
  
  console.info('[performance]', {
    operation: 'expensiveOperation',
    duration: `${duration.toFixed(2)}ms`,
    resultSize: result.length
  });
} catch (error) {
  const duration = performance.now() - startTime;
  console.error('[performance.error]', {
    operation: 'expensiveOperation',
    duration: `${duration.toFixed(2)}ms`,
    error: error.message
  });
}
```

---

## 5. Code Review Process

### 5.1 Pull Request Requirements

**Every PR must include:**

- [ ] **Clear title**: `feat:`, `fix:`, `refactor:` prefix
- [ ] **Description**: What changed, why, and any side effects
- [ ] **Issue link**: `Closes #123` in description
- [ ] **Tests**: New test cases for new functionality
- [ ] **Documentation**: Updated relevant `.md` files
- [ ] **No breaking changes**: Or documented with migration guide

**Example PR template:**

```markdown
## Description
Implement order filtering by stage in main sheet view

## Type of Change
- [x] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change

## Testing
- Added unit tests in `src/test/orderService.test.ts` (95% coverage)
- Added E2E test in `tests/order-filter.spec.ts`
- Manual QA: Tested on Chrome, Firefox, Safari

## Related Issues
Closes #456

## Checklist
- [x] Lint passes (`npm run lint`)
- [x] Tests pass (`npm run test`)
- [x] Build succeeds (`npm run build`)
- [x] Updated `docs/FEATURES.md`
```

### 5.2 Review Checklist

**Every PR reviewer must verify:**

1. **Code Quality**
   - [ ] No `any` types (or documented exceptions)
   - [ ] No console.log() in non-debug code
   - [ ] No hardcoded secrets or sensitive data
   - [ ] Proper error handling on all paths
   - [ ] Functions < 30 LOC, components < 250 LOC

2. **Testing**
   - [ ] New code has tests (meets coverage minimums)
   - [ ] All tests pass locally
   - [ ] E2E tests added for user workflows
   - [ ] No flaky tests introduced

3. **Documentation**
   - [ ] JSDoc comments on public APIs
   - [ ] Complex logic has explanatory comments
   - [ ] Related `.md` files updated
   - [ ] No outdated documentation left behind

4. **Performance**
   - [ ] No unnecessary re-renders (React)
   - [ ] No N+1 queries
   - [ ] Proper use of React Query caching
   - [ ] No memory leaks in effects

5. **Security**
   - [ ] No XSS vulnerabilities (input sanitization)
   - [ ] API calls use proper auth
   - [ ] Sensitive data not logged
   - [ ] CORS headers appropriate

### 5.3 Approval Rules

- **Minimum reviewers**: 1 approved review required
- **Automatic rejection**: If CI/CD pipeline fails
- **Dismissal trigger**: New commits require re-approval
- **Stale PR timeout**: Auto-close after 14 days of inactivity

---

## 6. Performance Standards & Monitoring

### 6.1 Frontend Performance Metrics

**Target metrics for user experience:**

| Metric | Target | Tool |
|--------|--------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Chrome DevTools, Lighthouse |
| **FID** (First Input Delay) | < 100ms | Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Web Vitals |
| **TTF** (Time to Interactive) | < 3.5s | Lighthouse |
| **Bundle size** | < 500KB (gzipped) | `next/bundle-analyzer` |

**Monitor in production:**

```typescript
// Install: npm install web-vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(metric => analytics.track('CLS', metric));
getLCP(metric => analytics.track('LCP', metric));
getFID(metric => analytics.track('FID', metric));
```

### 6.2 Backend Query Performance

**Supabase query guidelines:**

```typescript
// ✅ CORRECT: Select only needed columns
const { data } = await supabase
  .from('orders')
  .select('id, stage, createdAt, customer_name')  // Explicit columns
  .eq('stage', 'main')
  .limit(100);

// ❌ WRONG: SELECT * is inefficient
const { data } = await supabase
  .from('orders')
  .select('*');  // Fetches all columns
```

**Query optimization checklist:**

- [ ] Use indexed columns in `where` clauses
- [ ] Paginate large result sets (limit + offset)
- [ ] Select only required columns
- [ ] Use appropriate joins (avoid subqueries)
- [ ] Add database indexes for frequently filtered columns
- [ ] Profile queries with `EXPLAIN ANALYZE`

### 6.3 React Performance Optimization

```typescript
// ✅ CORRECT: Prevent unnecessary re-renders
import { memo, useMemo, useCallback } from 'react';

const OrderRow = memo(({ order, onSelect }) => {
  return <tr onClick={onSelect}>{order.id}</tr>;
}, (prev, next) => prev.order.id === next.order.id);

// Memoize expensive calculations
const filteredOrders = useMemo(
  () => orders.filter(o => o.stage === stage),
  [orders, stage]
);

// Memoize callbacks to prevent child re-renders
const handleSelect = useCallback((id) => {
  setSelected(id);
}, []);

// ✅ CORRECT: Use selective store selectors
const orders = useOrderStore(state => state.orders);  // Only subscribe to orders
// NOT: const store = useOrderStore();  // Re-renders on ANY store change
```

### 6.4 Monitoring & Alerting

**Set up alerts for production issues:**

- Error rate > 1% in 5 minutes
- Response time > 3 seconds (API)
- Database query time > 5 seconds
- Memory usage > 80%
- HTTP 5xx errors increase 300% in 5 minutes

---

## 7. Regression Prevention

### 7.1 Automated Regression Testing

**Maintain stable test suite:**

```bash
# Before merge to main
npm run test           # All unit tests
npm run e2e            # All E2E tests
npm run build          # Production build
npm run lint           # Code quality
```

### 7.2 Test Stability Requirements

- **No flaky tests**: Tests must pass 100% of runs
- **Quarantine failing tests**: Move to separate suite while investigating
- **Document skipped tests**: Use `test.skip()` with comment explaining why
- **Review test modifications**: Any test change needs review

```typescript
// ✅ CORRECT: Document skipped test
test.skip('should sync with backend on interval', async ({ page }) => {
  // TODO: Flaky on CI - timing issue with background tasks
  // Fixed in #789, restore when merged
  // ...
});
```

### 7.3 Data-Driven Regression Testing

**Test against real-world data samples:**

```typescript
describe('Order processing with various data states', () => {
  const testCases = [
    { orderId: 'ORD-001', stage: 'booking', expected: 'valid' },
    { orderId: 'ORD-002', stage: 'main', expected: 'valid' },
    { orderId: '', stage: 'booking', expected: 'error' },  // Edge case
    { orderId: null, stage: 'main', expected: 'error' }    // Boundary
  ];

  testCases.forEach(({ orderId, stage, expected }) => {
    it(`should handle orderId="${orderId}" in "${stage}" stage`, () => {
      // Test each scenario
    });
  });
});
```

### 7.4 Git History & Blame

- **Keep git history clean**: Squash commits before merging
- **Write meaningful commit messages**: Follow conventional commits
- **Link commits to issues**: Reference ticket in message

```
✅ CORRECT:
feat(orders): add filtering by stage in main sheet
docs: update order workflow documentation
Closes #456

❌ WRONG:
fix bug
update
misc changes
```

---

## 8. Production Monitoring & Incident Response

### 8.1 Production Health Dashboard

**Monitor these metrics 24/7:**

- Error rate and error types
- API response times (p50, p95, p99)
- Database query performance
- User session count and churn
- Page load times by route
- Memory and CPU usage

**Set up alerts in your monitoring service (Sentry, DataDog, etc.):**

```typescript
// Installation: npm install @sentry/nextjs
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive data before sending
    return event;
  }
});
```

### 8.2 Error Tracking

**Every production error must be tracked:**

```typescript
// ✅ CORRECT: Structured error reporting
try {
  await riskySuspenseOperation();
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      feature: 'order-processing',
      severity: 'critical'
    },
    contexts: {
      order: {
        orderId: orderData.id,
        stage: orderData.stage
      }
    }
  });

  // Also log locally for audit trail
  console.error('[order-processing]', {
    error: error.message,
    orderId: orderData.id,
    timestamp: new Date().toISOString()
  });
}
```

### 8.3 Incident Response Procedure

**If production incident occurs:**

1. **Immediate (0-5 min)**
   - [ ] Declare incident in Slack #incidents channel
   - [ ] Assign incident commander
   - [ ] Start incident timeline (who, what, when)
   - [ ] Notify affected teams

2. **Triage (5-15 min)**
   - [ ] Check error monitoring dashboard (Sentry)
   - [ ] Review recent deployments
   - [ ] Check infrastructure metrics (CPU, memory, DB)
   - [ ] Determine blast radius (% users affected)

3. **Mitigation (15-60 min)**
   - [ ] Deploy hotfix OR revert problematic change
   - [ ] Verify fix in production
   - [ ] Monitor error rate for recurrence
   - [ ] Notify stakeholders of resolution

4. **Post-Incident (within 24 hours)**
   - [ ] Write incident report (timeline + root cause)
   - [ ] Create follow-up tasks to prevent recurrence
   - [ ] Update runbooks/documentation
   - [ ] Share learnings in team standup

**Example incident log:**

```markdown
## Incident: Orders Not Saving (2024-01-15)

**Timeline:**
- 14:32: Error spike detected (Sentry alerts)
- 14:35: Confirmed database connection timeout
- 14:40: Scaled DB connection pool from 20 → 50
- 14:42: Error rate returned to normal
- 14:50: Identified cause (unoptimized N+1 query in PR #123)

**Root Cause:**
New order filter feature added 4 parallel queries without batching.

**Fix Applied:**
- Hotfix merged #789: Batch queries using `Promise.all()`
- Deployed 14:55

**Prevention:**
- [ ] Add performance test for query batching (#790)
- [ ] Update code review checklist for query optimization
```

### 8.4 Uptime & SLA Monitoring

**Maintain service uptime targets:**

- **Target**: 99.5% uptime (< 3.6 hours downtime/month)
- **Track**: Status page or uptime monitor
- **Alert threshold**: If any service goes down > 5 minutes

---

## 9. Documentation Requirements

### 9.1 When to Document

**Update these files when:**

| Change | File | When |
|--------|------|------|
| New feature/capability | `docs/FEATURES.md` | Feature complete & merged |
| Database schema change | `docs/DATABASE_SCHEMA.md` | After DB migration |
| Workflow state change | `docs/WORKFLOW_STATES.md` | After workflow logic changed |
| Performance guideline | `docs/PERFORMANCE.md` | After optimization discovered |
| Architecture decision | `docs/ARCHITECTURE.md` | Major structural change |
| Troubleshooting tip | `docs/TROUBLESHOOTING.md` | After resolving prod issue |

### 9.2 Code Comments: Only When Necessary

**Good comments explain WHY, not WHAT:**

```typescript
// ❌ BAD: Restates the code
const items = users.filter(u => u.active);  // Filter active users

// ✅ GOOD: Explains business logic
// Filter only active users; archived users should not appear in booking
const activeUsers = users.filter(u => u.active);

// ✅ GOOD: Complex algorithm needs explanation
// Use binary search to find the first order >= cutoff date (O(log n))
const index = binarySearch(orders, cutoffDate, compareByDate);

// ✅ GOOD: Documents non-obvious decision
// Retry with exponential backoff to handle temporary network issues
// Max retries set to 3 to avoid cascading failures
const result = await retryWithBackoff(fetchData, { maxRetries: 3 });
```

### 9.3 JSDoc for Public APIs

```typescript
/**
 * Fetches orders for a specific workflow stage with pagination support.
 *
 * @param {string} stage - The workflow stage ('booking', 'main', 'archive')
 * @param {number} page - Page number for pagination (0-indexed)
 * @param {number} pageSize - Number of orders per page (default: 50)
 * @returns {Promise<Order[]>} Array of orders for the specified stage
 * @throws {Error} If stage is invalid or API call fails
 *
 * @example
 * const orders = await orderService.getOrdersByStage('main', 0, 100);
 */
export async function getOrdersByStage(
  stage: string,
  page: number,
  pageSize: number = 50
): Promise<Order[]> {
  // Implementation
}
```

---

## 10. Enforcement & Governance

### 10.1 Automated Enforcement

- **Linting**: Biome enforces code style automatically
- **Type checking**: TypeScript strict mode catches type errors
- **Pre-commit hooks**: Husky prevents commits that fail `npm run lint` or `npm run test`
- **CI/CD pipeline**: GitHub Actions blocks merges that fail tests/build

### 10.2 Manual Review Checkpoints

- **Code review**: All PRs reviewed by minimum 1 team member
- **Architecture review**: Major features reviewed by tech lead
- **Security review**: Auth, API, and data handling reviewed by security lead

### 10.3 Metrics & Reporting

**Track these metrics monthly:**

| Metric | Target | Tool |
|--------|--------|------|
| Code coverage | 85%+ | Vitest coverage report |
| Test pass rate | 100% | CI/CD logs |
| Lint errors | 0 | Biome output |
| Security findings | 0 critical | Dependabot, code review |
| Incident count | < 2/month | Incident tracking |
| Mean time to fix (MTTR) | < 2 hours | Incident logs |

---

## Quick Reference: Daily Checklist

**Before committing:**
```bash
npm run lint      # ✅ Zero errors
npm run test      # ✅ All tests pass
npm run build     # ✅ Build succeeds
npm run e2e       # ✅ E2E tests pass (for major changes)
```

**Before submitting PR:**
- [ ] Updated tests for new code
- [ ] Updated relevant documentation
- [ ] No hardcoded secrets or sensitive data
- [ ] No `any` types without documentation
- [ ] Functions < 30 LOC, components < 250 LOC
- [ ] Meaningful commit messages with issue links

**Before merging to main:**
- [ ] Code reviewed and approved
- [ ] All CI/CD checks passing
- [ ] No breaking changes (or documented with migration guide)
- [ ] Performance metrics verified (no regressions)

---

## Additional Resources

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Performance Guide](https://nextjs.org/learn/seo/introduction-to-seo)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-04  
**Maintainer**: Engineering Team  

*Questions? Open an issue or discuss in #engineering-standards channel.*
