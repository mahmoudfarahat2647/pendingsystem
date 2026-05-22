import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const CategorySchema = z.enum(["note", "reminder", "reason"]);
const AddTemplateSchema = z.object({
	category: CategorySchema,
	text: z.string().trim().min(1).max(200),
});

function mapRow(row: Record<string, unknown>) {
	return {
		id: row.id,
		category: row.category,
		text: row.text,
		sortOrder: row.sort_order,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(req.url);
	const categoryParse = CategorySchema.safeParse(searchParams.get("category"));
	if (!categoryParse.success) {
		return NextResponse.json({ error: "Invalid category" }, { status: 400 });
	}

	try {
		const supabase = createServiceClient();
		const { data, error } = await supabase
			.from("quick_templates")
			.select("id, category, text, sort_order, created_at, updated_at")
			.eq("category", categoryParse.data)
			.order("sort_order", { ascending: true })
			.order("created_at", { ascending: true });

		if (error) throw new Error(error.message);
		return NextResponse.json((data ?? []).map(mapRow));
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		console.error("[quick-templates GET]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json().catch(() => null);
	const parse = AddTemplateSchema.safeParse(body);
	if (!parse.success) {
		return NextResponse.json(
			{ error: parse.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);
	}

	try {
		const supabase = createServiceClient();
		const { data, error } = await supabase
			.from("quick_templates")
			.insert({ category: parse.data.category, text: parse.data.text })
			.select("id, category, text, sort_order, created_at, updated_at")
			.single();

		if (error) {
			if (error.code === "23505") {
				return NextResponse.json(
					{ error: "Template already exists" },
					{ status: 409 },
				);
			}
			throw new Error(error.message);
		}
		return NextResponse.json(mapRow(data as Record<string, unknown>), {
			status: 201,
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		console.error("[quick-templates POST]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });
	}

	try {
		const supabase = createServiceClient();
		const { error, count } = await supabase
			.from("quick_templates")
			.delete({ count: "exact" })
			.eq("id", id);

		if (error) throw new Error(error.message);
		if (count === 0) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}
		return NextResponse.json(null, { status: 204 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		console.error("[quick-templates DELETE]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
