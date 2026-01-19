---
name: vitest-feature-protector
description: Automatically generates a Vitest unit test template for any new feature or component to protect existing code from being broken.
---

# Vitest Feature Protector

This skill helps the agent generate ready-to-use Vitest tests for any new feature or component in your project. It ensures that any new code is properly tested and prevents regressions in existing code.

## When to use this skill

- Use this when a **new feature** is added to the project.
- Use this when a **component** is created or modified.
- Use this to **protect existing code** from being accidentally broken.
- This is helpful when generating tests via AI automatically to keep standards consistent.

## How to use it

1. Identify the **new feature or component**.
2. Call this skill with the **feature name** and **type** (component / logic / function).
3. The agent will:
   - Generate a **Vitest template test** based on the feature type.
   - Include placeholders for rendering, props, state, and edge cases.
   - Suggest basic unit test scenarios automatically.
4. Copy the generated test into the appropriate `/tests/` folder:
   - Components → `/tests/components/`
   - Features → `/tests/features/`
5. Run **Vitest** to ensure all tests pass before merging or deploying.
6. Optionally, if TestSpirit is enabled, the agent can generate additional edge case tests automatically.

## Conventions

- Always start test files with `describe("FeatureName or ComponentName", () => { ... })`.
- Each test should use `it("should ...", () => { ... })`.
- Keep templates consistent with existing Vitest + Testing Library style.
- Place template files under `/tests/templates/` for reuse.
- Use meaningful test names for clarity.
