# pendingsystem

## Overview
pendingsystem is a Next.js-based logistics management platform for pendingsystem automotive service centers. It provides real-time inventory tracking, customer booking management, and end-to-end order workflows with an optimistic UI and sub-100ms perceived interaction latency.

## Goals
- Centralize pending parts tracking in one system
- Automate routine operations and status updates
- Provide real-time visibility across all workflow stages
- Enable efficient customer communication and scheduling

## Success Metrics
- Reduce manual data entry by 75%
- Improve inventory tracking accuracy to 99%
- Decrease average time from order to delivery by 30%
- Achieve 95% customer satisfaction for appointment scheduling
- Maintain 99.9% uptime

## Quick Start
1. Use Node.js 18.x or 20.x.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Contributing
- Follow the engineering standards in `ENGINEERING.md`.
- Update `FEATURES.md` when adding or modifying features.
- Run quality checks before opening a PR:
  ```bash
  npm run lint
  npm run test
  npm run build
  ```

## Development Commands
```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Biome lint + format check
npm run lint:fix     # Biome fix/format
npm run type-check   # TypeScript (no emit)
npm run test         # Vitest run
npm run test:watch   # Vitest watch
npm run test:ui      # Vitest UI
npm run e2e          # Playwright tests
npm run e2e:ui       # Playwright UI
npm run e2e:debug    # Playwright debug
npm run e2e:headed   # Playwright headed
npm run e2e:report   # Playwright report
```

## Project Structure
```
src/
|-- app/              # Next.js routes and pages
|-- components/       # React components (organized by feature)
|-- store/            # Zustand state management
|   |-- slices/       # Store action slices
|-- hooks/            # Custom React hooks
|-- lib/              # Utilities and helpers
|-- types/            # TypeScript types and Zod schemas
|-- test/             # Unit test setup
```

## Workflow Snapshot
1. orders  - New orders are created or imported.
2. main    - Active inventory processing.
3. call    - Customer contact queue for arrived parts.
4. booking - Appointment scheduling.
5. archive - Completed or cancelled records.

## Documentation
- `FEATURES.md` - Feature registry and product requirements
- `ENGINEERING.md` - Architecture, APIs, components, testing, and operations

## Legacy Docs
Older docs are archived under `docs/legacy/` and are no longer maintained.
