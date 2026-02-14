import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { CombinedStore, UIActions, UIState } from "../types";

const defaultPartStatuses = [
	{
		id: "no_stats",
		label: "No Stats",
		color: "bg-transparent border border-white/20",
	},
	{ id: "reserve", label: "Reserve", color: "#2563eb" },
	{ id: "arrived", label: "Arrived", color: "#10b981" },
	{ id: "not_arrived", label: "Not Arrived", color: "#1f2937" },
	{ id: "logistics", label: "Logistics Pending", color: "#facc15" },
	{ id: "branch", label: "Other Branch", color: "#92400e" },
	{ id: "issue", label: "Has Issue", color: "#ef4444" },
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
	models: [
		"Megane IV",
		"Clio V",
		"Kadjar",
		"Captur II",
		"Duster II",
		"Talisman",
	],
	repairSystems: ["Mechanical", "Electrical", "Body", "ضمان"],
	noteTemplates: ["Customer not available", "Wrong number", "Will call back"],
	reminderTemplates: ["Follow up call", "Check part status", "Confirm booking"],
	bookingTemplates: ["Morning slot", "Afternoon slot", "Next available"],
	reasonTemplates: ["Wrong part", "Customer cancelled", "Part damaged"],
	todos: [],
	notes: [],
	partStatuses: defaultPartStatuses,
	bookingStatuses: defaultBookingStatuses,
	isLocked: true,
	beastModeTriggers: {},
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
		if (id) {
			setTimeout(() => {
				if (get().highlightedRowId === id) {
					set({ highlightedRowId: null });
				}
			}, 5000);
		}
	},

	addModel: (model) => {
		set((state) => ({
			models: state.models.includes(model)
				? state.models
				: [...state.models, model],
		}));
	},

	removeModel: (model) => {
		set((state) => ({
			models: state.models.filter((m) => m !== model),
		}));
	},

	addRepairSystem: (system) => {
		set((state) => ({
			repairSystems: state.repairSystems.includes(system)
				? state.repairSystems
				: [...state.repairSystems, system],
		}));
	},

	removeRepairSystem: (system) => {
		set((state) => ({
			repairSystems: state.repairSystems.filter((s) => s !== system),
		}));
	},

	addTodo: (text) => {
		// pushUndo removed with the feature
		set((state) => ({
			todos: [
				...state.todos,
				{
					id: generateId(),
					text,
					completed: false,
					createdAt: new Date().toISOString(),
				},
			],
		}));
	},

	toggleTodo: (id) => {
		// pushUndo removed with the feature
		set((state) => ({
			todos: state.todos.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo,
			),
		}));
	},

	deleteTodo: (id) => {
		// pushUndo removed with the feature
		set((state) => ({
			todos: state.todos.filter((todo) => todo.id !== id),
		}));
	},

	addNote: (content, color) => {
		// pushUndo removed with the feature
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
		// pushUndo removed with the feature
		set((state) => ({
			notes: state.notes.map((note) =>
				note.id === id ? { ...note, content } : note,
			),
		}));
	},

	deleteNote: (id) => {
		// pushUndo removed with the feature
		set((state) => ({
			notes: state.notes.filter((note) => note.id !== id),
		}));
	},

	addNoteTemplate: (template) => {
		set((state) => ({
			noteTemplates: [...state.noteTemplates, template],
		}));
	},

	removeNoteTemplate: (template) => {
		set((state) => ({
			noteTemplates: state.noteTemplates.filter((t) => t !== template),
		}));
	},

	addReminderTemplate: (template) => {
		set((state) => ({
			reminderTemplates: [...state.reminderTemplates, template],
		}));
	},

	removeReminderTemplate: (template) => {
		set((state) => ({
			reminderTemplates: state.reminderTemplates.filter((t) => t !== template),
		}));
	},

	addReasonTemplate: (template) => {
		set((state) => ({
			reasonTemplates: [...state.reasonTemplates, template],
		}));
	},

	removeReasonTemplate: (template) => {
		set((state) => ({
			reasonTemplates: state.reasonTemplates.filter((t) => t !== template),
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

		const _oldLabel = statusToUpdate.label;
		const _newLabel = updates.label;

		set((state) => ({
			partStatuses: state.partStatuses.map((s) =>
				s.id === id ? { ...s, ...updates } : s,
			),
		}));

		// If label changed, bulk update of server data rows in Zustand removed
		// Server data is now managed solely by React Query cache.
	},

	removePartStatusDef: (id) => {
		if (id === "no_stats") return; // Prevent deleting default option
		set((state) => ({
			partStatuses: state.partStatuses.filter((s) => s.id !== id),
		}));
	},

	setIsLocked: (isLocked) => set({ isLocked }),

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
});
