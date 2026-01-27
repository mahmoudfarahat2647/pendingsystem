---
trigger: manual
---
---
name: ci-clutter-cleanup
description: Cleans up dead code and obsolete tests, removes clutter, and stabilizes CI pipelines. Use when CI is failing due to removed features, flaky tests, or unused artifacts.
---

# CI & Clutter Cleanup Skill

This skill helps keep the codebase clean and the CI pipeline trustworthy by removing obsolete tests, dead code, and unnecessary clutter **without affecting active functionality**.

## When to use this skill

Use this skill when:
- CI is failing due to tests for removed or deprecated features
- There are skipped, commented-out, or unused tests with no plan to return
- The repository contains dead code, helpers, selectors, or fixtures
- The CI signal is noisy or unreliable
- A feature has been permanently removed and related tests still exist

Do **not** use this skill for:
- Debugging real product bugs
- Features that are temporarily disabled
- Experimental or WIP branches

## Cleanup principles (must follow)

- Prefer **deleting** dead tests over skipping them
- Only remove code that is:
  - Not referenced
  - Not reachable via UI, route, or API
  - Tied to a permanently removed feature
- Never remove active coverage
- Never change product behavior
- Keep changes minimal and reversible

## How to use this skill

Follow these steps strictly:

### 1. Identify clutter
- Locate tests for features that no longer exist
- Find `test.skip`, commented tests, or disabled specs
- Detect unused helpers, selectors, fixtures, and mocks
- Check CI logs for consistently failing or flaky specs

### 2. Decide: delete vs keep
- **Delete** if the feature is permanently removed
- **Keep** if the feature is planned to return
- **Skip temporarily** only if explicitly instructed

### 3. Perform cleanup
- Delete obsolete Playwright/Jest specs
- Remove unused test utilities and fixtures
- Remove references from:
  - Test indexes
  - CI configs
  - Documentation

### 4. Validate CI
- Ensure all remaining tests:
  - Are deterministic
  - Reflect real user behavior
- Confirm CI passes cleanly
- CI should fail only on real regressions

## Decision guide

- Feature removed forever? → **Delete tests**
- Feature paused temporarily? → **Skip with comment**
- Test flaky due to timing/state? → **Fix test, don’t delete**
- Code unused and unreferenced? → **Remove**

## Output expectations

- A clean test suite
- Minimal clutter
- A CI pipeline that acts as a reliable quality gate
- No functional or behavioral changes to the product

Focus on **dead code and dead tests only**.

