# Renault Pending System - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Overview
The **Renault Pending System** is a Next.js-based logistics management platform specifically designed for **Renault automotive service centers**. It provides real-time inventory tracking, customer booking management, and comprehensive order workflows with a premium dark-themed interface featuring Renault brand colors. The system streamlines the entire lifecycle of automotive parts from order placement to customer delivery with **optimistic UI updates** and **sub-100ms perceived latency**.

### 1.2 Product Vision
To create an efficient, intuitive logistics platform that reduces operational overhead for **Renault service centers** by automating routine tasks, providing real-time visibility into inventory status, and facilitating seamless customer communication through a **premium dark-themed interface** with **Renault Yellow (#FFCC00)** accent colors.

### 1.3 Success Metrics
- Reduce manual data entry by 75%
- Improve inventory tracking accuracy to 99%
- Decrease average time from order to delivery by 30%
- Achieve 95% customer satisfaction for appointment scheduling
- Enable 24/7 system availability with 99.9% uptime

## 2. Problem Statement

### 2.1 Current Challenges
- Manual tracking of pending parts creates inefficiencies
- Lack of real-time visibility into inventory status
- Disconnected systems for customer communication and scheduling
- Difficulty in tracking the lifecycle of parts from order to delivery
- Absence of automated workflows for common operations

### 2.2 Target Users
- Automotive service center managers
- Service advisors and technicians
- Customer service representatives
- Parts department staff
- Scheduling coordinators

## 3. Product Goals & Objectives

### 3.1 Primary Goals
- Centralize all pending parts tracking in one system
- Automate routine operations and status updates
- Provide real-time visibility across all stages of the workflow
- Enable efficient customer communication and scheduling

### 3.2 Secondary Goals
- Minimize training time with intuitive UI
- Ensure data consistency across all modules
- Support mobile accessibility for on-the-go access
- Provide reporting and analytics capabilities

## 4. Functional Requirements

### 4.1 Order Management Module
- **FR-001**: Import bulk orders from external sources
- **FR-002**: Manually add/edit/delete individual orders
- **FR-003**: Attach documents and notes to orders
- **FR-004**: Generate unique tracking IDs for all orders
- **FR-005**: Validate duplicate entries and name mismatches
- **FR-006**: Commit orders to Main Sheet for inventory tracking

### 4.2 Main Sheet (Inventory Tracking)
- **FR-007**: Track part status through lifecycle (Pending → Arrived → Available → Call List)
- **FR-008**: Enable status updates with visual indicators
- **FR-009**: Implement auto-move workflow when all parts arrive
- **FR-010**: Provide locking mechanism to prevent accidental edits
- **FR-011**: Support bulk operations on selected items

### 4.3 Customer Communication (Call List)
- **FR-012**: Manage customer contact queue
- **FR-013**: Track call status and log communications
- **FR-014**: Facilitate movement to booking appointments
- **FR-015**: Support note attachments for customer interactions

### 4.4 Booking System
- **FR-016**: Provide premium calendar interface for scheduling
- **FR-017**: Support multi-customer VIN grouping
- **FR-018**: Enable pre-booking note configuration
- **FR-019**: Implement visual booking indicators (color-coded)
- **FR-020**: Maintain 2-year historical booking retention
- **FR-021**: Allow rebooking with automatic note logging

### 4.5 Archive
- **FR-022**: Document archived reasons for compliance
- **FR-023**: Enable reorder capability from archived items

### 4.6 Notification System
- **FR-024**: Implement responsive alert system with numbered badges
- **FR-025**: Provide direct navigation to source items
- **FR-026**: Display detailed metadata (Due Date, Customer Name, VIN, Tracking ID)
- **FR-027**: Support individual and bulk notification management

### 4.7 Search & Discovery
- **FR-028**: Enable cross-tab search functionality
- **FR-029**: Search across VIN, Customer Name, Part Number, and Company
- **FR-030**: Provide direct navigation to source rows
- **FR-031**: Support advanced filtering capabilities

### 4.8 Settings & Configuration
- **FR-032**: Provide tabbed interface for Part Statuses and Appearance
- **FR-033**: Enable centralized management of Part Status definitions

## 5. Technical Requirements

### 5.1 Platform Requirements
- **Frontend Framework**: Next.js 15.5.9 with React 19.0.0
- **Styling**: Tailwind CSS 3.4.17 with Radix UI components (@ark-ui/react, @radix-ui/*)
- **State Management**: Zustand 5.0.2 with localStorage persistence (key: "pending-sys-storage-v1.1")
- **Data Grid**: ag-Grid Community v32.3.3 with React wrapper
- **Charts**: Recharts 2.15.0 for data visualization
- **Icons**: Lucide React 0.468.0 and HugeIcons 1.1.4
- **Animations**: Framer Motion 12.23.26 for smooth transitions
- **Database**: Supabase 2.89.0 for data persistence
- **Server State**: TanStack Query 5.90.16 for optimistic updates
- **Testing**: Vitest 4.0.16 for unit tests, Playwright 1.57.0 for E2E tests
- **Notifications**: Sonner 1.7.1 for toast notifications

### 5.2 Performance Requirements
- **Response Time**: Sub-100ms perceived latency for all UI interactions
- **Optimistic UI**: Instant reactivity with 0ms perceived latency for data updates using TanStack Query
- **Grid Performance**: Support for thousands of rows with ag-Grid virtualization
- **Memory Management**: Selective persistence to reduce localStorage overhead (partialize strategy)
- **Set-based Lookups**: O(1) performance for data operations using Set instead of array filtering
- **Index-based Updates**: Direct array modification for optimal performance

### 5.3 Security Requirements
- **Client-Side Only**: No backend API, file-based operations
- **Storage Isolation**: Per-domain localStorage security
- **Type Safety**: Full TypeScript coverage for type safety
- **PII Minimization**: Personal information handling minimized

### 5.4 Compatibility Requirements
- **Browser Support**: Modern browsers supporting ES6+ features
- **Device Support**: Desktop/laptop optimized with responsive considerations
- **Screen Sizes**: Support for various screen resolutions

## 6. User Experience Requirements

### 6.1 UI/UX Standards
- **Design System**: Dark mode default with **Renault Yellow (#FFCC00)** accents
- **Typography**: Inter font with optimized loading
- **Animations**: Framer Motion for smooth transitions and modal interactions
- **Icons**: Lucide React and HugeIcons for consistent visual language
- **Accessibility**: Tooltips for icon-only buttons, keyboard navigation support
- **Components**: Radix UI primitives with custom theming
- **Error Handling**: ClientErrorBoundary with graceful fallbacks

### 6.2 User Interaction Patterns
- **Consistency**: Standardized UI across all modules
- **Safety**: Confirmation dialogs for all destructive actions
- **Feedback**: Immediate visual feedback for all user actions
- **Navigation**: Intuitive tab-based navigation between modules

## 7. Data Model

### 7.1 Core Data Structures

#### PendingRow (Orders Module)
```typescript
interface PendingRow {
  id: string;                    // Unique identifier
  baseId: string;                // Source order ID
  vin: string;                   // Vehicle identification
  partNumber: string;            // Part code
  partDescription: string;       // Human-readable part name
  quantity: number;              // Order quantity
  partStatus: string;            // Dynamic part status (lookup in partStatuses)
  trackingId: string;            // Auto-generated (ORDER-{baseId})
  attachments?: Attachment[];
  notes?: string;
}
```

#### BookingEntry (Booking Module)
```typescript
interface BookingEntry {
  id: string;
  vins: string[];                // Multi-VIN support
  date: string;                  // ISO format
  notes?: string;
  status?: string;
  bookingStatuses: Map<string, string>;  // Per-VIN status
}
```

### 7.2 Status Workflow
```
Orders (Staging) → Main Sheet (Pending) → Main Sheet (Arrived) → Call List → Booking → Archive
```

## 8. Integration Requirements

### 8.1 Current Integrations
- **Supabase**: Database integration for data persistence and real-time updates
- **AG-Grid**: Advanced data grid with reactive custom components and optimized cell renderers
- **Recharts**: Data visualization for dashboard charts (CapacityChart, DistributionChart)
- **TanStack Query**: Server state management with optimistic updates and cache management
- **Framer Motion**: Animation library for smooth UI transitions
- **Sonner**: Toast notification system for user feedback
- **React Day Picker**: Date selection for booking system
- **Zod**: Schema validation for type safety

### 8.2 Future Integration Plans
- **Backend API**: For cloud synchronization (planned)
- **Real-time Collaboration**: WebSocket integration (planned)
- **Mobile Application**: Native mobile support (planned)

## 9. Constraints & Limitations

### 9.1 Technical Constraints
- Client-side only architecture (no server backend)
- Local storage limitations for data persistence
- Browser-specific performance characteristics

### 9.2 Business Constraints
- Automotive service center focused (not general-purpose)
- Renault Pending System-specific branding and workflow requirements

## 10. Risk Assessment

### 10.1 Technical Risks
- **Data Loss**: Local storage limitations could lead to data loss
- **Performance**: Large datasets may impact client-side performance
- **Browser Compatibility**: Modern JavaScript features may not work on older browsers

### 10.2 Business Risks
- **User Adoption**: Resistance to changing from existing manual processes
- **Training**: Need for comprehensive user training on new system
- **Compliance**: Potential regulatory changes affecting data handling

## 11. Success Criteria

### 11.1 Functional Success Criteria
- All core modules (Orders, Main Sheet, Booking, Call List, Archive) operational
- Automated workflows functioning as specified
- Cross-module search and navigation working seamlessly

### 11.2 Performance Success Criteria
- System responds to user actions within 100ms perceived time
- Supports concurrent operations without performance degradation
- Maintains data integrity during all operations

### 11.3 User Experience Success Criteria
- User training time under 2 hours for basic operations
- 90% of common operations achievable in 3 clicks or less
- Positive user feedback on system intuitiveness and efficiency

## 12. Timeline & Milestones

### Phase 1: Core Functionality (Months 1-2)
- Orders and Main Sheet modules
- Basic inventory tracking
- Status update functionality

### Phase 2: Customer Experience (Months 2-3)
- Booking system implementation
- Call List module
- Notification system

### Phase 3: Advanced Features (Months 3-4)
- Archive management
- Advanced search capabilities
- Reporting features

### Phase 4: Optimization (Months 4-5)
- Performance improvements
- UI/UX refinements
- Comprehensive testing

## 13. Assumptions & Dependencies

### 13.1 Assumptions
- Users have basic computer literacy
- Stable internet connection available
- No major changes to business processes during development

### 13.2 Dependencies
- Next.js and React ecosystem stability
- Third-party library compatibility
- Hardware requirements met by target users

## 14. Implementation Status & Features

### 14.1 Currently Implemented Features

#### Dashboard (`/`)
- **Hero Section**: Renault-branded dashboard with background image
- **Real-time Stats**: Total Pending, Active Orders, Call Queue with live data
- **Interactive Charts**: Capacity pie chart and Distribution bar chart with lazy loading
- **Calendar Widget**: Glass-morphism calendar with current month view

#### Orders Management (`/orders`)
- **OrderFormModal**: Comprehensive order creation with 44KB of functionality
- **OrdersToolbar**: Bulk operations and filtering capabilities
- **Import/Export**: Bulk order import from external sources
- **Attachment Support**: Document and note attachments
- **Tracking IDs**: Auto-generated ORDER-{baseId} format

#### Main Sheet (`/main-sheet`)
- **Dynamic Data Grid**: ag-Grid with custom cell renderers
- **Status Management**: Definition-driven status system with visual indicators
- **Auto-move Workflow**: Automatic transition when all parts arrive
- **Bulk Operations**: Multi-select with status updates
- **Locking Mechanism**: Prevent accidental edits

#### Booking System (`/booking`)
- **BookingCalendarGrid**: Premium dark-themed calendar interface
- **BookingSidebar**: Multi-VIN customer grouping with detailed views
- **Visual Indicators**: Color-coded booking status dots
- **2-year Retention**: Historical booking data management
- **Pre-booking Notes**: Configuration for appointment details

#### Call List (`/call-list`)
- **Customer Queue**: Organized contact management
- **Call Status Tracking**: Communication logging
- **Auto-move Integration**: Seamless transition from Main Sheet
- **Note Attachments**: Customer interaction documentation

#### Archive (`/archive`)
- **Read-only Records**: Completed items stored without edit access
- **Archive Reasons**: Documentation for compliance
- **Reorder Capability**: Quick reordering from archived items

#### Search & Discovery
- **Cross-tab Search**: Global search across VIN, Customer Name, Part Number, Company
- **SearchResultsView**: Advanced filtering and navigation
- **Direct Navigation**: Click-to-navigate to source rows

#### Settings & Configuration
- **Part Status Management**: Centralized status definition with color customization
- **Appearance Settings**: Theme and visual preferences

### 14.2 Technical Implementation Details

#### State Management Architecture
```typescript
// Zustand store with selective persistence
export const useAppStore = create<CombinedStore>()(
  persist(
    (...a) => ({
      ...createOrdersSlice(...a),
      ...createInventorySlice(...a),
      ...createBookingSlice(...a),
      ...createNotificationSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: "pending-sys-storage-v1.1",
      partialize: (state) => {
        // Selective persistence strategy
      }
    }
  )
);
```

#### Optimistic UI Pattern
```typescript
// TanStack Query with optimistic updates
onMutate: async ({ id, updates, stage }) => {
  await queryClient.cancelQueries({ queryKey: ["orders", stage] });
  const previousOrders = queryClient.getQueryData(["orders", stage]);
  queryClient.setQueryData(["orders", stage], (old) => 
    old?.map(order => order.id === id ? { ...order, ...updates } : order)
  );
  return { previousOrders };
}
```

#### Performance Optimizations
- **Set-based O(1) Lookups**: Replace array filtering with Set operations
- **Index-based Updates**: Direct array modification for bulk operations
- **Memoized Components**: React.memo and useMemo for render optimization
- **Lazy Loading**: Dynamic imports for charts and heavy components
- **Debounced Operations**: 300ms debouncing for status updates

## 15. Testing Strategy

### 15.1 Unit Testing (Vitest)
- Component testing with Testing Library
- Store action testing with mock data
- Utility function validation
- Performance benchmarking

### 15.2 E2E Testing (Playwright)
- Full workflow testing from Orders to Archive
- Cross-browser compatibility validation
- Performance testing with large datasets
- Accessibility compliance testing

### 15.3 TestSprite Integration
- Automated test generation and execution
- Code summary and PRD synchronization
- Regression testing for critical workflows

## 16. Deployment & Operations

### 16.1 Build Process
```json
{
  "scripts": {
    "dev": "node --max-old-space-size=4096 node_modules/next/dist/bin/next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check ."
  }
}
```

### 16.2 Quality Assurance
- **Biome**: Code formatting and linting
- **Husky**: Git hooks for commit validation
- **TypeScript**: Full type coverage with strict mode
- **Documentation**: Auto-generated JSDoc extraction

## 17. Appendices

### Appendix A: Glossary
- **VIN**: Vehicle Identification Number
- **Part Status**: Lifecycle status (Pending, Arrived, Available, Reserved, etc.)
- **Tracking ID**: System-generated unique identifier (ORDER-{baseId})
- **Auto-move**: Automated transition between stages when conditions are met
- **Optimistic UI**: Instant UI updates with rollback on error
- **Set-based Lookup**: O(1) performance using JavaScript Set objects

### Appendix B: Architecture Overview
```
Frontend: Next.js 15 + React 19 + TypeScript
├── State: Zustand (localStorage) + TanStack Query (server)
├── UI: Tailwind CSS + Radix UI + Framer Motion
├── Data: Supabase + ag-Grid + Recharts
├── Testing: Vitest + Playwright + TestSprite
└── Tools: Biome + Husky + TypeScript
```

### Appendix C: User Stories
- As a **service advisor**, I want to track pending parts from order to delivery so I can provide accurate timelines to customers
- As a **scheduler**, I want to see all upcoming appointments in a premium calendar view so I can optimize resource allocation
- As a **manager**, I want real-time dashboard analytics so I can monitor operational efficiency
- As a **technician**, I want instant status updates so I can plan my work effectively
- As a **customer service representative**, I want comprehensive call management so I can maintain excellent customer communication

---

**Document Version**: 2.0 - Aligned with Current Implementation  
**Last Updated**: January 23, 2026  
**System**: Renault Pending System v0.1.0
