# Contributing to pendingsystem

Welcome to the pendingsystem project! This guide provides information for developers who want to contribute to the codebase.

## 🛠️ Development Setup

1.  **Node.js**: Ensure you are using Node.js 18.x or 20.x (check `.github/workflows/ci.yml`).
2.  **Clone & Install**:
    ```bash
    git clone <repository-url>
    cd pendingsystem
    npm install
    ```
3.  **Environment Variables**:
    ```bash
    cp .env.example .env.local
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🏗️ Standards & Practices

### Code Style
- Ensure consistent code formatting before committing.
- Follow the project's TypeScript conventions.

### State Management
- Use **Zustand** slices for modular state management (`src/store/slices/`).
- Always define actions and state in `src/store/types.ts`.
- Avoid direct state mutations; use the `set` and `get` functions provided by the slice creator.

### Testing
- We use **Vitest** for unit and integration testing.
- New features should include unit tests in `__tests__` directories within their respective folders.
- Run `npm run test` to verify your changes.

### Git Workflow
- Create feature branches: `feat/your-feature`, `fix/your-fix`, etc.
- Always target the `main` branch with Pull Requests.
- PRs should pass the CI pipeline (lint, test, build) before being merged.

## 📁 Feature Registry
Always update [FEATURES.md](FEATURES.md) when adding new system capabilities.

## 📜 Documentation
- Use **JSDoc** for public APIs, custom hooks, and complex utility functions.
- Keep the **README.md** updated with major technical changes.

---

Thank you for contributing!
