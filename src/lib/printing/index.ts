/**
 * @module Printing
 * @description Centralized printing utilities for Renault automotive system
 *
 * This module exports all document generation functions for printing official forms and labels.
 * All print operations are isolated in new browser windows to prevent CSS bleeding from the main application.
 *
 * @example
 * ```typescript
 * import { printReservationLabels, printOrderDocument } from "@/lib/printing";
 *
 * // Print reservation labels
 * printReservationLabels(selectedOrders);
 *
 * // Print order documents
 * printOrderDocument(selectedOrders);
 * ```
 */

export { printOrderDocument } from "./orderDocument";
export { printReservationLabels } from "./reservationLabels";
