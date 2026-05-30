import { useRef, useState } from "react";
import { generateId } from "@/lib/utils";
import type { PartEntry } from "@/types";

export function useOrderParts(initialParts?: PartEntry[]) {
	// Parts state
	const [parts, setParts] = useState<PartEntry[]>(
		initialParts || [
			{ id: generateId(), partNumber: "", description: "", quantity: 1 },
		],
	);
	const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);

	const handleAddPartRow = () => {
		setParts((prev) => [
			...prev,
			{ id: generateId(), partNumber: "", description: "", quantity: 1 },
		]);
	};

	const handleRemovePartRow = (id: string) => {
		setParts((prev) => prev.filter((p) => p.id !== id));
	};

	const handlePartChange = (
		id: string,
		field: Exclude<keyof PartEntry, "quantity">,
		value: string,
	) => {
		setParts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
		);
	};

	const handlePartQuantityChange = (id: string, value: number) => {
		const qty = Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
		setParts((prev) =>
			prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)),
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
		handlePartQuantityChange,
		handleBulkImportParts,
	};
}
