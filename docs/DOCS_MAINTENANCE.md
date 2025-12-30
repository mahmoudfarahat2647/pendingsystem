# Documentation Automation & Maintenance Guide

This guide explains how to maintain and extend the auto-documentation system.

---

## 🔄 Auto/Manual Section Markers

All documentation files use markers to separate auto-generated content from manual content.

### Syntax

```markdown
<!-- AUTO-GENERATED START: SECTION_NAME -->
This content is generated from source code via:
- JSDoc extraction
- TypeScript parsing
- Git hooks

Do NOT edit this section manually.
It will be overwritten on next generation.
<!-- AUTO-GENERATED END -->

<!-- MANUAL START: SECTION_NAME -->
This content is written by humans and preserved.
Explains patterns, best practices, and rationale.

Only humans should edit this section.
<!-- MANUAL END -->
```

### Example

```markdown
# Store API Reference

<!-- AUTO-GENERATED START: ORDERS_SLICE -->
## Orders Slice

### `addOrder(order: PendingRow): void`
Create a single new order in staging.
<!-- AUTO-GENERATED END -->

<!-- MANUAL START: USAGE_PATTERNS -->
## Usage Patterns

### Pattern 1: Import and Commit Orders
```typescript
const { addOrders, commitToMainSheet } = useAppStore();
```
<!-- MANUAL END -->
```

---

## 🔧 Available Scripts

### 1. **Validate Documentation**

```bash
npm run docs:validate
```

**Checks:**
- All required sections present
- Balanced auto/manual markers
- No broken links
- Code block syntax

**Output:**
```
📋 Documentation Validation Report
==================================================
✅ All checks passed!
```

### 2. **Extract JSDoc from Code**

```bash
npm run docs:extract
```

**Output:**
```
🔍 Scanning store slices for JSDoc...
✅ ordersSlice.ts: Found 5 documented functions
✅ inventorySlice.ts: Found 6 documented functions
```

**With markdown output:**
```bash
npm run docs:extract -- --output > /tmp/generated.md
```

### 3. **Generate Store API Docs** (Coming)

```bash
npm run docs:generate:store
# Auto-updates STORE_API.md from JSDoc
```

### 4. **Generate Component Docs** (Coming)

```bash
npm run docs:generate:components
# Auto-updates COMPONENTS.md from JSDoc
```

---

## 📋 JSDoc Requirements

### Store Actions (Required)

Every action in `src/store/slices/*.ts` must have JSDoc:

```typescript
/**
 * Brief one-line description of what the action does
 * 
 * Longer explanation if needed:
 * - What it does
 * - When to use it
 * - Side effects or triggers
 * - Performance considerations if relevant
 * 
 * @param paramName - Description of parameter
 * @param anotherParam - Description
 * @returns What it returns (if applicable)
 * 
 * @example
 * // Real working code example
 * addOrders([
 *   { id: "1", baseId: "B001", vin: "...", ... }
 * ])
 * 
 * @see docs/STORE_API.md#section-name - Related documentation
 */
myAction: (paramName, anotherParam) => {
  // implementation
}
```

### Components (Required for Complex Components)

All components in `src/components/{booking,shared,grid}/` must have module JSDoc:

```typescript
/**
 * @module ComponentName
 * @description What this component does and why
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * @see docs/COMPONENTS.md#component-name
 * @see docs/STORE_API.md#related-action
 */

interface Props {
  /** Description of prop */
  propName: Type;
  // ...
}

export const ComponentName = (props: Props) => {
  // ...
}
```

---

## 🔄 Workflow for Updating Documentation

### When You Add a New Store Action

1. **Add JSDoc** to the action in `src/store/slices/`:
```typescript
/**
 * My new action description
 * @param id - The ID
 * @example newAction("id-123")
 */
myNewAction: (id) => { }
```

2. **Run validation**:
```bash
npm run docs:validate
```

3. **Extract and review**:
```bash
npm run docs:extract -- --output | head -20
```

4. **Commit**:
```bash
git add src/store/slices/
git commit -m "feat: add myNewAction with JSDoc"
# Pre-commit hook reminds to update docs
```

5. **Update STORE_API.md**:
- Copy generated markdown from `docs:extract` output
- Paste into appropriate slice section under `<!-- AUTO-GENERATED -->`
- Add examples under `<!-- MANUAL -->`

### When You Add a New Component

1. **Add JSDoc module comment** to component file
2. **Document Props** interface with JSDoc
3. **Run validation**:
```bash
npm run docs:validate
```

4. **Update COMPONENTS.md**:
- Add entry under appropriate category
- Include component props table
- Add usage example
- Link to STORE_API if relevant

### When You Find and Fix a Bug

1. **Fix the bug**
2. **If it's a common issue**, add to TROUBLESHOOTING.md:
```markdown
### Problem Description
...

**Solutions:**
1. Solution step 1
2. Solution step 2

**Code fix:**
\`\`\`typescript
// Working solution
\`\`\`
```

3. **Validate**:
```bash
npm run docs:validate
```

---

## 📊 Documentation Checklist

Use this checklist before committing changes:

```bash
# Pre-commit checklist
[ ] Code has JSDoc comments
[ ] Component has @module comment
[ ] Examples are realistic and working
[ ] Links are correct (@see references)
[ ] Run validation:
    npm run docs:validate
[ ] Check for broken links:
    npm run docs:validate --check-links
[ ] Auto/manual markers are balanced
[ ] No merge conflicts in docs/
```

**Auto-enforced by git hook** (`.husky/pre-commit`):
```bash
✓ Extract JSDoc from changes
✓ Validate documentation structure
✓ Warn about missing updates
✓ Block commits if validation fails
```

---

## 🚀 Future Automation

### Phase 2: CI/CD Integration

GitHub Actions will automatically:

```yaml
# On every push to main
- Extract JSDoc from changed files
- Generate markdown
- Commit updated docs
- Validate with npm run docs:validate
```

### Phase 3: Real-time IDE Updates

VS Code extension will:
- Watch for JSDoc changes
- Auto-update docs as you type
- Highlight broken references

---

## 🧪 Testing Documentation

### Validate All Docs

```bash
npm run docs:validate
```

### Check for Broken Links

```bash
npm run docs:validate -- --check-links
```

### Generate Report

```bash
npm run docs:validate -- --report
```

---

## 📝 Documentation Standards

### Code Examples

✅ **Good examples:**
- Real, working code
- Clear variable names
- Show common use cases
- Include expected output

❌ **Bad examples:**
- Pseudocode
- Single letter variables (foo, bar)
- Complex edge cases without explanation
- Outdated patterns

### Explanations

✅ **Good explanations:**
- Why (not just how)
- When to use
- Common mistakes
- Performance implications

❌ **Bad explanations:**
- Too brief
- Assume too much knowledge
- No context
- Outdated information

### Section Organization

```markdown
# Feature Name

<!-- AUTO-GENERATED START -->
## API Reference
[Auto-generated from JSDoc]
<!-- AUTO-GENERATED END -->

<!-- MANUAL START -->
## Overview
[Why this feature exists]

## Use Cases
[Common scenarios]

## Examples
[Real-world usage]

## Best Practices
[Do's and don'ts]

## Troubleshooting
[Common issues]

## See Also
[Related features]
<!-- MANUAL END -->
```

---

## 🔗 Integration Points

### Git Hooks

**File**: `.husky/pre-commit`

```bash
# Runs before each commit:
1. Detects changed files
2. Extracts JSDoc if code changed
3. Validates docs structure
4. Warns about missing updates
5. Blocks commit if validation fails
```

### CI/CD Pipeline

**File**: `.github/workflows/validate-docs.yml` (to be created)

```yaml
# On push to main/develop:
1. Extract JSDoc from diffs
2. Generate markdown
3. Run validation
4. Auto-commit if changes
5. Comment on PR with summary
```

### IDE Integration

**VS Code Extension** (future):
- Watch JSDoc changes
- Update docs in real-time
- Highlight broken references
- Suggest documentation

---

## 📞 Support & Questions

### How do I...

**Update an action's documentation?**
1. Update JSDoc in source code
2. Run `npm run docs:extract`
3. Copy output to STORE_API.md
4. Commit

**Add a new troubleshooting solution?**
1. Add section to TROUBLESHOOTING.md under appropriate category
2. Include problem statement and solutions
3. Add code examples
4. Run `npm run docs:validate`
5. Commit

**Fix a broken link?**
1. Run `npm run docs:validate --check-links`
2. Fix paths in markdown
3. Commit

**Update features.md?**
- Required when new feature added (enforced by DEVELOPMENT_RULES.md)
- Edit [features.md](../features.md) directly
- Follow existing format

---

## 🎯 Success Metrics

- ✅ 100% of store actions have JSDoc
- ✅ 0 broken links in documentation
- ✅ 100% validation pass rate
- ✅ Docs updated within 1 commit of code change
- ✅ No merge conflicts in docs/

---

**Last Updated**: December 30, 2025
**Maintained By**: Development Team

See also: [docs/DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)
