# System Feature Registry

## Workflow Stages

pendingsystem manages automotive part rows across five operational stages:
`orders`, `main`, `call`, `booking`, and `archive`.

## Status Management

The STATS column is backed by `PendingRow.status`. User-managed status labels
such as `Arrived`, `Reserve`, and `Not Arrived` are configured in Settings under
Statuses and are rendered as colored dots in the STATS column.

The legacy PART STATUS grid column has been removed. New code should not read or
write `partStatus`; status dropdowns, reserve-label printing, and VIN auto-move
logic all use `status`.

## Reorder Flow

The Reorder workflow remains isolated. Reorder rows use `status: "Reorder"` and
continue to render with the existing gold STATS text treatment.
