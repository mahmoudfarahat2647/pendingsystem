# Renault Pending System - Documentation Hub

Complete documentation for the Renault Pending System logistics management platform.

## 📚 Documentation Index

### Core Documentation
- **[Architecture Overview](./ARCHITECTURE.md)** - System design, modules, and data flow
- **[Store API Reference](./STORE_API.md)** - Zustand store actions and state management
- **[Component Guide](./COMPONENTS.md)** - Complex component documentation and patterns
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** - Quick reference and learning paths

### Development Guidelines
- **[Development Rules](./DEVELOPMENT_RULES.md)** - Core coding standards and guidelines
- **[Testing Prompt](./TESTING_PROMPT.md)** - Playwright test generation guide
- **[Docs Maintenance Guide](./DOCS_MAINTENANCE.md)** - Auto-documentation system and workflows

### Related Documents (Project Root)
- **[Features Registry](../features.md)** - Comprehensive feature list
- **[Performance Optimization](../PERFORMANCE_OPTIMIZATION.md)** - Performance best practices
- **[Contributing Guidelines](../CONTRIBUTING.md)** - Development standards and workflow

---

## 🚀 Quick Start

### For New Developers
1. Read [Architecture Overview](./ARCHITECTURE.md) (10 min)
2. Review [Store API Reference](./STORE_API.md) (15 min)
3. Check [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues

### For Feature Development
1. Reference [Component Guide](./COMPONENTS.md)
2. Check [Store API Reference](./STORE_API.md) for state management
3. Update [../features.md](../features.md) when adding new features

### For Debugging
1. Consult [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Check browser console for error details
3. Review [PERFORMANCE_OPTIMIZATION.md](../PERFORMANCE_OPTIMIZATION.md) if slowness occurs

---

## 📋 Development Commands

```bash
# Documentation
npm run docs          # Generate TypeDoc API documentation
npm run docs:components # Generate component documentation

# Testing & Quality
npm test             # Run unit tests
npm test:watch       # Watch mode
npm e2e              # Run Playwright tests
npm run lint         # Biome lint check
```

---

## 🏗️ Project Structure

```
src/
├── app/              # Next.js pages and routing
├── components/       # React components (organized by feature)
├── store/            # Zustand state management
│   └── slices/       # Store action slices
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── types/            # TypeScript type definitions
└── test/             # Test configuration
```

---

## 💾 State Management Overview

The app uses **Zustand** with six specialized slices:

| Slice | Purpose | Key Actions |
|-------|---------|------------|
| **Orders** | New part requests | `addOrders`, `updateOrder`, `deleteOrders` |
| **Inventory** | Active inventory tracking | `commitToMainSheet`, `updatePartStatus` |
| **Booking** | Customer appointments | `sendToBooking`, `updateBookingStatus` |
| **Call List** | Customer communication | `sendToCallList`, `markCallCompleted` |
| **Notifications** | System alerts | `addNotification`, `clearNotifications` |
| **History** | Undo/redo operations | `addCommit`, `undo`, `redo` |

→ See [Store API Reference](./STORE_API.md) for detailed action signatures

---

## 🎯 Data Flow

```
Orders (New Requests)
    ↓
Main Sheet (Pending Status)
    ↓
Call List (Customer Contact)
    ↓
Booking (Scheduled Appointments)
    ↓
Archive (Historical Records)
```

---

## 🔍 Key Components

**Complex Components** (documented in [COMPONENTS.md](./COMPONENTS.md)):
- `BookingCalendarModal` - Multi-customer booking calendar
- `OrderFormModal` - Bulk order creation
- `SearchResultsView` - Advanced search interface
- `DataGrid` - Flexible ag-grid wrapper

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS settings |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Unit test configuration |
| `playwright.config.ts` | E2E test configuration |

---

## 📞 Support & Questions

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md) first
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- See [features.md](../features.md) for feature specifications

---

**Last Updated**: December 30, 2025
**Maintained By**: Development Team
