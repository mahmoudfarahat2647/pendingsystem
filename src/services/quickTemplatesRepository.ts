import { createServiceClient } from "@/lib/supabase-admin";
import { mapKeysToCamel } from "@/lib/utils";

export type TemplateCategory = "note" | "reminder" | "reason";

const TEMPLATE_SELECT =
	"id, category, text, sort_order, created_at, updated_at";

export async function getTemplates(category: TemplateCategory) {
	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("quick_templates")
		.select(TEMPLATE_SELECT)
		.eq("category", category)
		.order("sort_order", { ascending: true })
		.order("created_at", { ascending: true });
	if (error) throw new Error(error.message);
	return (data ?? []).map((row) =>
		mapKeysToCamel(row as Record<string, unknown>),
	);
}

export async function addTemplate(category: TemplateCategory, text: string) {
	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("quick_templates")
		.insert({ category, text })
		.select(TEMPLATE_SELECT)
		.single();
	if (error) {
		if (error.code === "23505") {
			const conflict = new Error("Template already exists");
			(conflict as Error & { code: string }).code = "23505";
			throw conflict;
		}
		throw new Error(error.message);
	}
	return mapKeysToCamel(data as Record<string, unknown>);
}

export async function deleteTemplate(id: string): Promise<boolean> {
	const supabase = createServiceClient();
	const { error, count } = await supabase
		.from("quick_templates")
		.delete({ count: "exact" })
		.eq("id", id);
	if (error) throw new Error(error.message);
	return (count ?? 0) > 0;
}
