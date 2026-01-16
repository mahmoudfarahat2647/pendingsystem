import type { StateCreator } from "zustand";
import { generateId } from "@/lib/utils";
import type { PendingRow } from "@/types";
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
		get().addCommit("Add Model");
	},

	removeModel: (model) => {
		set((state) => ({
			models: state.models.filter((m) => m !== model),
		}));
		get().addCommit("Remove Model");
	},

	addRepairSystem: (system) => {
		set((state) => ({
			repairSystems: state.repairSystems.includes(system)
				? state.repairSystems
				: [...state.repairSystems, system],
		}));
		get().addCommit("Add Repair System");
	},

	removeRepairSystem: (system) => {
		set((state) => ({
			repairSystems: state.repairSystems.filter((s) => s !== system),
		}));
		get().addCommit("Remove Repair System");
	},

	addTodo: (text) => {
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
		get().addCommit("Add Todo");
	},

	toggleTodo: (id) => {
		set((state) => ({
			todos: state.todos.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo,
			),
		}));
		get().debouncedCommit("Toggle Todo");
	},

	deleteTodo: (id) => {
		set((state) => ({
			todos: state.todos.filter((todo) => todo.id !== id),
		}));
		get().addCommit("Delete Todo");
	},

	addNote: (content, color) => {
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
		get().addCommit("Add Note");
	},

	updateNote: (id, content) => {
		set((state) => ({
			notes: state.notes.map((note) =>
				note.id === id ? { ...note, content } : note,
			),
		}));
		get().addCommit("Update Note");
	},

	deleteNote: (id) => {
		set((state) => ({
			notes: state.notes.filter((note) => note.id !== id),
		}));
		get().addCommit("Delete Note");
	},

	addNoteTemplate: (template) => {
		set((state) => ({
			noteTemplates: [...state.noteTemplates, template],
		}));
		get().addCommit("Add Note Template");
	},

	removeNoteTemplate: (template) => {
		set((state) => ({
			noteTemplates: state.noteTemplates.filter((t) => t !== template),
		}));
		get().addCommit("Remove Note Template");
	},

	addReminderTemplate: (template) => {
		set((state) => ({
			reminderTemplates: [...state.reminderTemplates, template],
		}));
		get().addCommit("Add Reminder Template");
	},

	removeReminderTemplate: (template) => {
		set((state) => ({
			reminderTemplates: state.reminderTemplates.filter((t) => t !== template),
		}));
		get().addCommit("Remove Reminder Template");
	},

	addReasonTemplate: (template) => {
		set((state) => ({
			reasonTemplates: [...state.reasonTemplates, template],
		}));
		get().addCommit("Add Reason Template");
	},

	removeReasonTemplate: (template) => {
		set((state) => ({
			reasonTemplates: state.reasonTemplates.filter((t) => t !== template),
		}));
		get().addCommit("Remove Reason Template");
	},

	addPartStatusDef: (status) => {
		set((state) => ({
			partStatuses: [...state.partStatuses, status],
		}));
		get().addCommit("Add Part Status Definition");
	},

	updatePartStatusDef: (id, updates) => {
		const state = get();
		const statusToUpdate = state.partStatuses.find((s) => s.id === id);
		if (!statusToUpdate) return;

		const oldLabel = statusToUpdate.label;
		const newLabel = updates.label;

		set((state) => ({
			partStatuses: state.partStatuses.map((s) =>
				s.id === id ? { ...s, ...updates } : s,
			),
		}));

		// If label changed, bulk update all rows
		if (newLabel && newLabel !== oldLabel) {
			const updateRows = (rows: PendingRow[]) =>
				rows.map((row) =>
					row.partStatus === oldLabel ? { ...row, partStatus: newLabel } : row,
				);

			set((state) => ({
				ordersRowData: updateRows(state.ordersRowData),
				rowData: updateRows(state.rowData),
				callRowData: updateRows(state.callRowData),
				archiveRowData: updateRows(state.archiveRowData),
				bookingRowData: updateRows(state.bookingRowData),
			}));
		}

		get().addCommit("Update Part Status Definition");
	},

	removePartStatusDef: (id) => {
		if (id === "no_stats") return; // Prevent deleting default option
		set((state) => ({
			partStatuses: state.partStatuses.filter((s) => s.id !== id),
		}));
		get().addCommit("Remove Part Status Definition");
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

	resetStore: () => {
		set({
			ordersRowData: [],
			rowData: [],
			callRowData: [],
			archiveRowData: [],
			bookingRowData: [],
			notifications: [],
			commits: [],
			redos: [],
			...initialState,
		});
		get().addCommit("Reset Store");
	},
});
