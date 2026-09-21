export const SEARCH_SOURCES = [
	{
		source: "Main Sheet",
		dotColor: "bg-indigo-500",
		activeRingColor: "ring-indigo-400",
	},
	{
		source: "Orders",
		dotColor: "bg-orange-500",
		activeRingColor: "ring-orange-400",
	},
	{
		source: "Booking",
		dotColor: "bg-purple-500",
		activeRingColor: "ring-purple-400",
	},
	{
		source: "Call",
		dotColor: "bg-blue-500",
		activeRingColor: "ring-blue-400",
	},
	{
		source: "Archive",
		dotColor: "bg-slate-500",
		activeRingColor: "ring-slate-400",
	},
	{
		source: "Freeze",
		dotColor: "bg-sky-500",
		activeRingColor: "ring-sky-400",
	},
] as const;

export type SearchSource = (typeof SEARCH_SOURCES)[number]["source"];
