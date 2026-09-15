import type { OrderStage } from "@/domain/order/orderStage";
import { createServiceClient } from "@/lib/supabase-admin";
import { mapKeysToCamel } from "@/lib/utils";

export type TemplateCategory = "note" | "reminder" | "reason";

const TEMPLATE_SELECT =
	"id, category, text, sort_order, stage, created_at, updated_at";

export async function getTemplates(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	const supabase = createServiceClient();
	let query = supabase
		.from("quick_templates")
		.select(TEMPLATE_SELECT)
		.eq("category", category);
	query = stage ? query.eq("stage", stage) : query.is("stage", null);
	const { data, error } = await query
		.order("sort_order", { ascending: true })
		.order("created_at", { ascending: true });
	if (error) throw new Error(error.message);
	return (data ?? []).map((row) =>
		mapKeysToCamel(row as Record<string, unknown>),
	);
}

export async function addTemplate(
	category: TemplateCategory,
	text: string,
	stage?: OrderStage,
) {
	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("quick_templates")
		.insert({ category, text, stage: stage ?? null })
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

export async function deleteTemplate(
	id: string,
	category: TemplateCategory,
	stage?: OrderStage,
): Promise<boolean> {
	const supabase = createServiceClient();
	let query = supabase
		.from("quick_templates")
		.delete({ count: "exact" })
		.eq("id", id)
		.eq("category", category);
	query = stage ? query.eq("stage", stage) : query.is("stage", null);
	const { error, count } = await query;
	if (error) throw new Error(error.message);
	return (count ?? 0) > 0;
}
