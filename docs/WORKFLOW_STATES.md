# Workflow States and Transitions

This document outlines the core business logic governing order stages and status transitions within the Renault System.

## Order Stages (`OrderStage`)

The application organizes data into five primary stages, each represented by a dedicated tab in the UI:

1.  **`orders`**: Initial stage where new orders are created or received.
2.  **`main`**: The "Main Sheet" for active processing of logistics data.
3.  **`call`**: The "Call List" for parts that have arrived and require customer notification.
4.  **`booking`**: Orders scheduled for service or installation.
5.  **`archive`**: Completed or cancelled orders moved out of the active cycle.

## State Transitions

### Manual Transitions
Users can move rows between stages using the "Send to..." actions in the context menus or toolbars across almost all tabs.

### Automatic Transitions
- **Auto-Move to Call List**: When a part's status is updated to **"Arrived"**, the system checks all other parts associated with the same **VIN**. If all parts for that VIN are marked as "Arrived", all associated rows are automatically transitioned from `orders` or `main` to the `call` stage.

## Part Statuses

Common statuses across all stages include:
- `Pending`: Initial state.
- `Ordered`: Part has been ordered from the supplier.
- `Arrived`: Part has reached the local inventory.
- `Hold`: Order is temporarily paused.
- `Ready`: Ready for the next stage (e.g., booking).
