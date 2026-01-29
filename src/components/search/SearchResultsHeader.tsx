import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResultsHeaderProps {
	searchTerm: string;
	resultCount: number;
	counts: Record<string, number>;
	onClear: () => void;
	activeSources: string[];
	onToggleSource: (source: string) => void;
}

export const SearchResultsHeader = ({
	searchTerm,
	resultCount,
	counts,
	onClear,
	activeSources,
	onToggleSource,
}: SearchResultsHeaderProps) => {
	const allSources = Object.keys(counts);
	const hasActiveFilters =
		activeSources.length > 0 && activeSources.length < allSources.length;

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
				{Object.entries(counts).map(([source, count]) => {
					const isActive =
						activeSources.length === 0 || activeSources.includes(source);
					return (
						<button
							key={source}
							type="button"
							onClick={() => onToggleSource(source)}
							className={cn(
								"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-200",
								isActive
									? "bg-white/10 border-white/10 text-gray-200"
									: "bg-transparent border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10",
							)}
						>
							<span
								className={cn("w-1.5 h-1.5 rounded-full", {
									"bg-indigo-500": source === "Main Sheet",
									"bg-orange-500": source === "Orders",
									"bg-purple-500": source === "Booking",
									"bg-blue-500": source === "Call",
									"bg-slate-500": source === "Archive",
									"opacity-40": !isActive,
								})}
							/>
							<span>{source}</span>
							<span
								className={cn(
									"ml-1 font-mono",
									isActive ? "text-gray-500" : "text-gray-700",
								)}
							>
								{count}
							</span>
						</button>
					);
				})}
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
