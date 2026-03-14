import { useRef, useState } from "react";
import { generateId } from "@/lib/utils";
import type { PartEntry } from "@/types";

export function useOrderParts(initialParts?: PartEntry[]) {
	// Parts state
	const [parts, setParts] = useState<PartEntry[]>(
		initialParts || [{ id: generateId(), partNumber: "", description: "" }],
	);
	const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);

	const handleAddPartRow = () => {
		setParts((prev) => [
			...prev,
			{ id: generateId(), partNumber: "", description: "" },
		]);
	};

	const handleRemovePartRow = (id: string) => {
		setParts((prev) => prev.filter((p) => p.id !== id));
	};

	const handlePartChange = (
		id: string,
		field: keyof PartEntry,
		value: string,
	) => {
		setParts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
		);
	};

	const handleBulkImportParts = (newParts: PartEntry[]) => {
		setParts((prev) => {
			if (prev.length === 1 && !prev[0].partNumber && !prev[0].description) {
				// Replace the empty placeholder row
				return newParts;
			}
			// Append to existing
			return [...prev, ...newParts];
		});
	};

	return {
		parts,
		setParts,
		descriptionRefs,
		handleAddPartRow,
		handleRemovePartRow,
		handlePartChange,
		handleBulkImportParts,
	};
}
