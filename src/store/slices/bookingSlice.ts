import type { StateCreator } from "zustand";
import type { BookingActions, BookingState, CombinedStore } from "../types";

/**
 * Booking slice - Placeholder for future UI-only booking state
 *
 * All server data is now managed by React Query.
 * This slice is kept as a placeholder for potential future UI-only state
 * related to the booking page (e.g., expanded rows, filters, etc.)
 */
export const createBookingSlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	BookingState & BookingActions
> = (_set, _get) => ({
	// Empty - all booking data is now in React Query cache
});
