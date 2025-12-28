# Frontend Testing Suite - Renault System

This directory contains comprehensive Playwright tests for the Renault System frontend application.

## Test Coverage

The test suite includes **8 comprehensive test files** with over **100+ test cases** covering:

### 1. **Dashboard Tests** (`dashboard.spec.ts`)
- Dashboard page load and layout
- Statistics cards display
- Navigation to all main pages (Main Sheet, Booking, Orders, Archive, Call List)
- Warranty calculator functionality
- Chart displays

### 2. **Main Sheet Tests** (`main-sheet.spec.ts`)
- Data grid rendering with large datasets
- Lock/unlock sheet functionality
- Toolbar actions
- Row selection and modal interactions
- Auto-lock timer (5-minute timeout)
- Responsive grid layout
- Search and filter controls
- Pagination support

### 3. **Booking Tests** (`booking.spec.ts`)
- Booking page load and grid display
- Calendar/date filtering
- Row selection with checkboxes
- Archive and reorder operations
- Download/export functionality
- Modal dialogs
- Responsive design on multiple screen sizes
- Sorting and filtering

### 4. **Orders Tests** (`orders.spec.ts`)
- Orders grid display
- Create new order form modal
- Multiple order selection
- Order status indicators
- Sorting and pagination
- Loading states
- Responsive layout

### 5. **Archive & Call List Tests** (`archive-calllist.spec.ts`)
- Archive functionality:
  - View archived items
  - Restore items from archive
  - Permanent deletion
  - Archive reasons display
- Call List functionality:
  - Call list grid
  - Phone number display
  - Call actions
  - Customer details
  - Call history/status
  - Priority call filtering

### 6. **Accessibility Tests** (`accessibility.spec.ts`)
- WCAG compliance checks
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (ARIA labels, roles)
- Color contrast
- Focus management in dialogs
- Form labels association
- Heading hierarchy
- Image alt text
- Language attributes
- Loading state announcements

### 7. **Navigation Tests** (`navigation.spec.ts`)
- Page-to-page navigation
- Browser back/forward buttons
- Navigation state preservation
- Error page handling
- Page refresh functionality
- Keyboard shortcuts
- Form input handling
- Notifications/Toasts
- Dropdown menus
- Search functionality
- Tooltip interactions

### 8. **Performance & Edge Cases Tests** (`performance.spec.ts`)
- Page load performance
- Empty data states
- Very long content handling
- Rapid page navigation
- Multiple rapid button clicks
- Network error handling
- Large data grid scrolling performance
- Dialog rapid open/close
- Special characters in inputs
- Unicode character support
- Date input handling
- Checkbox state changes
- Window resize handling
- Multiple tabs handling
- Memory leak testing

## Installation

The tests require Playwright to be installed:

```bash
npm install
npx playwright install  # Install Playwright browsers
```

## Running Tests

### Run all tests
```bash
npm run e2e
```

### Run tests in UI mode (interactive)
```bash
npm run e2e:ui
```

### Run tests in headed mode (visible browser)
```bash
npm run e2e:headed
```

### Debug a specific test
```bash
npm run e2e:debug -- tests/dashboard.spec.ts
```

### Generate and view HTML report
```bash
npm run e2e
npm run e2e:report
```

### Run specific test file
```bash
npx playwright test tests/dashboard.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "should load"
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Configuration

The Playwright configuration is defined in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Recorded on first retry
- **Parallel**: Tests run in parallel (adjust workers in config)

## Development Server

Tests automatically start the development server before running:

```bash
npm run dev
```

The server must be running on `http://localhost:3000` for tests to work.

## Test Fixtures

Custom fixtures are available in `tests/fixtures/fixtures.ts`:

- `authenticatedPage`: Automatically navigates to home page before each test

```typescript
test('my test', async ({ authenticatedPage }) => {
  // Page is already on home page
});
```

## Best Practices Used

1. **Role-based locators**: Using `getByRole()` for semantic locating
2. **Auto-retrying assertions**: Waiting for elements without explicit timeouts
3. **No hardcoded waits**: Using `waitForLoadState('networkidle')` instead
4. **Resilient selectors**: Using accessible selectors that won't break with UI changes
5. **Test isolation**: Each test is independent and can run in any order
6. **Descriptive test names**: Clear test names explain what is being tested
7. **Meaningful assertions**: Testing actual user behavior, not implementation details

## Test Reports

After running tests, an HTML report is generated:

```bash
npm run e2e:report
```

This opens an interactive report showing:
- Passed/failed tests
- Screenshots of failures
- Video recordings
- Detailed error messages
- Trace information for debugging

## CI/CD Integration

Tests are configured to run in CI environments with:
- Retries enabled (2 retries)
- Single worker for consistency
- HTML report generation
- Video recording on failure

To run in CI:
```bash
CI=true npm run e2e
```

## Debugging Tests

### Step-by-step debugging
```bash
npm run e2e:debug -- tests/dashboard.spec.ts
```

### View test trace
The trace is automatically saved on first retry and can be viewed:
```bash
npx playwright show-trace path/to/trace.zip
```

### Inspect selectors
Use the Inspector tool:
```bash
npx playwright codegen http://localhost:3000
```

## Adding New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `tests` directory
2. Import fixtures: `import { test, expect } from '../fixtures/fixtures';`
3. Use descriptive test names
4. Leverage role-based selectors
5. Use `await page.waitForLoadState('networkidle')` for load waits
6. Add meaningful assertions
7. Run tests locally before committing: `npm run e2e`

Example:
```typescript
import { test, expect } from '../fixtures/fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    await page.waitForLoadState('networkidle');
    
    const button = page.getByRole('button', { name: /action/i });
    await expect(button).toBeVisible();
    await button.click();
    
    await expect(page).toHaveURL(/.*expected-path/);
  });
});
```

## Troubleshooting

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running on port 3000
- Check network connectivity

### Element not found
- Use Inspector to find correct selector: `npx playwright codegen`
- Check if element is visible with `.isVisible()`
- Use more resilient selectors (role-based)

### Tests run too slowly
- Reduce number of workers if system is slow
- Check if dev server is optimized
- Look for unnecessary `waitForTimeout()` calls

### Screenshots/videos missing
- Check test output directory: `test-results/`
- Ensure tests are actually failing to capture artifacts
- Check `playwright.config.ts` for artifact settings

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
