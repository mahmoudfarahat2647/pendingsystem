import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { CombinedStore, UIActions, UIState } from "../types";

export const PROTECTED_REPAIR_SYSTEMS = ["ضمان"];

// Built-in part-status IDs whose colors are locked — UI must not allow editing these.
const BUILT_IN_PART_STATUS_IDS = new Set([
	"no_stats",
	"hold",
	"reserve",
	"branch",
	"arrive",
]);

export const defaultPartStatuses = [
	{ id: "no_stats", label: "Pending", color: "" },
	{ id: "hold", label: "Hold", color: "#3b82f6" },
	{ id: "reserve", label: "Reserve", color: "#8b5cf6" },
	{ id: "branch", label: "Branch", color: "#92400e" },
	{ id: "arrive", label: "Arrived", color: "#10b981" },
];

const defaultBookingStatuses = [
	{ id: "confirmed", label: "Confirmed", color: "#10b981" },
	{ id: "pending", label: "Pending", color: "#facc15" },
	{ id: "cancelled", label: "Cancelled", color: "#ef4444" },
	{ id: "completed", label: "Completed", color: "#3b82f6" },
];

const initialState: UIState = {
	searchTerm: "",
	highlightedRowId: null,
	pendingVinSelection: null,
	notes: [],
	partStatuses: defaultPartStatuses,
	bookingStatuses: defaultBookingStatuses,
	isLocked: true,
	gridEditPermission: false,
	beastModeTriggers: {},
	currentEditVin: null,
	currentEditId: null,
	pendingSearchSelection: null,
};

export const createUISlice: StateCreator<
	CombinedStore,
	[["zustand/persist", unknown]],
	[],
	UIState & UIActions
> = (set, get) => ({
	...initialState,

	setSearchTerm: (term) => set({ searchTerm: term }),

	setHighlightedRowId: (id) => {
		set({ highlightedRowId: id });
	},

	setPendingVinSelection: (vin) => set({ pendingVinSelection: vin }),

	addNote: (content, color) => {
		// NOTE: Sticky notes are UI-only, not included in draft session undo
		set((state) => ({
			notes: [
				...state.notes,
				{
					id: generateId(),
					content,
					color,
					createdAt: new Date().toISOString(),
				},
			],
		}));
	},

	updateNote: (id, content) => {
		// NOTE: Sticky notes are UI-only, not included in draft session undo
		set((state) => ({
			notes: state.notes.map((note) =>
				note.id === id ? { ...note, content } : note,
			),
		}));
	},

	deleteNote: (id) => {
		// NOTE: Sticky notes are UI-only, not included in draft session undo
		set((state) => ({
			notes: state.notes.filter((note) => note.id !== id),
		}));
	},

	addPartStatusDef: (status) => {
		set((state) => ({
			partStatuses: [...state.partStatuses, status],
		}));
	},

	updatePartStatusDef: (id, updates) => {
		const state = get();
		const statusToUpdate = state.partStatuses.find((s) => s.id === id);
		if (!statusToUpdate) return;

		// Built-in statuses have locked colors — strip any incoming color change.
		const safeUpdates = BUILT_IN_PART_STATUS_IDS.has(id)
			? (() => {
					const { color: _color, ...rest } = updates;
					return rest;
				})()
			: updates;

		set((state) => ({
			partStatuses: state.partStatuses.map((s) =>
				s.id === id ? { ...s, ...safeUpdates } : s,
			),
		}));
	},

	removePartStatusDef: (id) => {
		if (id === "no_stats") return; // Prevent deleting default option
		set((state) => ({
			partStatuses: state.partStatuses.filter((s) => s.id !== id),
		}));
	},

	setIsLocked: (isLocked) => set({ isLocked }),
	setGridEditPermission: (gridEditPermission) => set({ gridEditPermission }),

	// CRITICAL: BEAST MODE SYNC - DO NOT MODIFY WITHOUT REVIEW
	// This tracks when an order failed validation during commit,
	// enabling the global 30s timer to persist across modal re-opens.
	triggerBeastMode: (id, timestamp) => {
		set((state) => ({
			beastModeTriggers: {
				...state.beastModeTriggers,
				[id]: timestamp,
			},
		}));
	},

	clearBeastMode: (id) => {
		set((state) => {
			const newTriggers = { ...state.beastModeTriggers };
			delete newTriggers[id];
			return { beastModeTriggers: newTriggers };
		});
	},

	setCurrentEditVin: (vin, editId) => {
		set({ currentEditVin: vin, currentEditId: editId });
	},

	clearCurrentEditVin: () => {
		set({ currentEditVin: null, currentEditId: null });
	},

	setPendingSearchSelection: (val) => set({ pendingSearchSelection: val }),
});
