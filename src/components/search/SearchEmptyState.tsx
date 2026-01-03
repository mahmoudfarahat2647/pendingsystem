import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
	searchTerm: string;
	onClear: () => void;
}

export const SearchEmptyState = ({
	searchTerm,
	onClear,
}: SearchEmptyStateProps) => {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
			<div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
				<SearchIcon className="w-8 h-8 text-gray-600" />
			</div>
			<div>
				<h3 className="text-lg font-medium text-white/80">No results found</h3>
				<p className="text-sm text-gray-500 mt-1 max-w-xs">
					We couldn't find any records matching "{searchTerm}". Try different
					keywords or check spelling.
				</p>
			</div>
			<Button
				onClick={onClear}
				variant="outline"
				className="mt-4 border-white/10 hover:bg-white/5"
			>
				Clear Search Input
			</Button>
		</div>
	);
};
