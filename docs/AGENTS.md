# Docs Guardrails

These instructions apply to files under `docs/`.

## Folder purpose

The `docs` folder is reserved for stable feature reference documents created after a feature is confirmed to be working correctly.

Treat these files as constitutional references for the current accepted behavior of the product.

## Rules for agents

- do not modify, rewrite, rename, move, or delete feature documentation in `docs/` unless the user explicitly asks to amend that specific document
- a generic request like "update docs", "clean docs", or "improve wording" is not enough permission to change an existing feature reference document
- if code changes would conflict with a document in `docs/`, stop and ask whether the code should be fixed or the document should be amended
- when a new feature becomes stable, creating a new reference document in `docs/` is allowed when the user asks for it
- prefer adding a new file over altering an existing accepted reference document
- `docs/AGENTS.md` may be updated only when the user explicitly wants to change the documentation policy for this folder

## Current protected reference

The following file is already an accepted constitutional reference:

- `order-form-reference.md`

## Intended use

Use feature documents in `docs/` as the stable reference for things like:

- workflow rules
- validation rules
- duplicate protection rules
- save semantics
- non-obvious invariants
