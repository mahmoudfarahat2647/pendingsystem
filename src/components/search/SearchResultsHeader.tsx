import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResultsHeaderProps {
	searchTerm: string;
	resultCount: number;
	counts: Record<string, number>;
	onClear: () => void;
}

export const SearchResultsHeader = ({
	searchTerm,
	resultCount,
	counts,
	onClear,
}: SearchResultsHeaderProps) => {
	return (
		<div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0b]/50 backdrop-blur-xl">
			<div className="flex items-center gap-4">
				<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
					<SearchIcon className="w-5 h-5" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-white/90">
						Global Search Results
					</h2>
					<div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
						<span className="text-white font-medium">{resultCount}</span>{" "}
						matches for
						<span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">
							"{searchTerm}"
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{Object.entries(counts).map(([source, count]) => (
					<div
						key={source}
						className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300"
					>
						<span
							className={cn("w-1.5 h-1.5 rounded-full", {
								"bg-indigo-500": source === "Main Sheet",
								"bg-orange-500": source === "Orders",
								"bg-purple-500": source === "Booking",
								"bg-blue-500": source === "Call",
								"bg-slate-500": source === "Archive",
							})}
						/>
						<span>{source}</span>
						<span className="text-gray-500 ml-1 font-mono">{count}</span>
					</div>
				))}
				<div className="w-px h-6 bg-white/10 mx-2" />
				<Button
					onClick={onClear}
					variant="ghost"
					size="sm"
					className="text-gray-400 hover:text-white hover:bg-white/5"
				>
					<X className="w-4 h-4 mr-2" />
					Clear Search
				</Button>
			</div>
		</div>
	);
};
