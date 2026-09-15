import type { OrderStage } from "@/domain/order/orderStage";

export type TemplateCategory = "note" | "reminder" | "reason";

export interface QuickTemplate {
	id: string;
	category: TemplateCategory;
	text: string;
	sortOrder: number;
	stage: OrderStage | null;
	createdAt: string;
	updatedAt: string;
}

export const quickTemplatesService = {
	async list(
		category: TemplateCategory,
		stage?: OrderStage,
	): Promise<QuickTemplate[]> {
		const stageParam = stage ? `&stage=${stage}` : "";
		const response = await fetch(
			`/api/quick-templates?category=${category}${stageParam}`,
		);
		if (!response.ok) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as QuickTemplate[];
	},

	async add(
		category: TemplateCategory,
		text: string,
		stage?: OrderStage,
	): Promise<QuickTemplate> {
		const response = await fetch("/api/quick-templates", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ category, text, stage }),
		});
		if (!response.ok) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as QuickTemplate;
	},

	async remove(
		id: string,
		category: TemplateCategory,
		stage?: OrderStage,
	): Promise<void> {
		const stageParam = stage ? `&stage=${stage}` : "";
		const response = await fetch(
			`/api/quick-templates?id=${id}&category=${category}${stageParam}`,
			{ method: "DELETE" },
		);
		if (!response.ok && response.status !== 204) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
	},
};
