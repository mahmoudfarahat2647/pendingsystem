# Renault System

A premium, high-performance maintenance management system built with Next.js 15 and AG Grid. Designed for organized tracking of service orders, inventory, call lists, and bookings.

## 🚀 Tech Stack

- **Framework**: [Next.js 15.1](https://nextjs.org/) (App Router)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Grid**: [AG Grid Community 32.3](https://www.ag-grid.com/)
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand) (with Persistence & Slices)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm (or yarn / pnpm / bun)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd renault-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
src/
├── app/           # Next.js App Router routes & layouts
├── components/    # Feature-based & shared UI components
│   ├── booking/   # Booking-specific logic
│   ├── grid/      # Core AG Grid implementation & hooks
│   ├── shared/    # Common layouts, modals, and headers
│   └── ui/        # Atomic UI primitives (shadcn)
├── hooks/         # Global custom hooks (modals, row logic)
├── lib/           # Utilities, AG Grid configuration, printing
├── store/         # Zustand store with domain-driven slices
└── types/         # Centralized TypeScript definitions
```

## 📜 Features

See [features.md](file:///d:/renault-system/features.md) for a detailed breakdown of all system capabilities.

## 🧪 Testing

Run unit and integration tests:
```bash
npm run test
```

For UI-based test watching:
```bash
npm run test:ui
```

## 🏗️ Build & Deployment

Build the production application:
```bash
npm run build
```

This project is configured for **standalone** output, optimized for Docker/container deployments.

---

Built with ❤️ for modern service management.
