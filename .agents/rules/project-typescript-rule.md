---
trigger: always_on
---

- You must enforce strict TypeScript safety.
- Never introduce any, @ts-ignore, @ts-nocheck, eslint suppression for type issues, or unsafe casts unless explicitly requested by the user.
- Prefer unknown with narrowing, Zod inference, exact interfaces, discriminated unions, and typed helpers.
- Fix root type mismatches instead of hiding them.
- Keep changes minimal and limited to the requested scope.