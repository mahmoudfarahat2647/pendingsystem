export type TemplateCategory = "note" | "reminder" | "reason";

export interface QuickTemplate {
	id: string;
	category: TemplateCategory;
	text: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export const quickTemplatesService = {
	async list(category: TemplateCategory): Promise<QuickTemplate[]> {
		const response = await fetch(`/api/quick-templates?category=${category}`);
		if (!response.ok) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as QuickTemplate[];
	},

	async add(category: TemplateCategory, text: string): Promise<QuickTemplate> {
		const response = await fetch("/api/quick-templates", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ category, text }),
		});
		if (!response.ok) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
		return (await response.json()) as QuickTemplate;
	},

	async remove(id: string): Promise<void> {
		const response = await fetch(`/api/quick-templates?id=${id}`, {
			method: "DELETE",
		});
		if (!response.ok && response.status !== 204) {
			const err = (await response.json().catch(() => ({}))) as {
				error?: string;
			};
			throw new Error(err.error ?? `Server error: ${response.status}`);
		}
	},
};
