import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
	addTemplate,
	deleteTemplate,
	getTemplates,
} from "@/services/quickTemplatesRepository";

export const runtime = "nodejs";

const CategorySchema = z.enum(["note", "reminder", "reason"]);
const AddTemplateSchema = z.object({
	category: CategorySchema,
	text: z.string().trim().min(1).max(200),
});

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const categoryParse = CategorySchema.safeParse(
		new URL(req.url).searchParams.get("category"),
	);
	if (!categoryParse.success)
		return NextResponse.json({ error: "Invalid category" }, { status: 400 });

	try {
		return NextResponse.json(await getTemplates(categoryParse.data));
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		logger.error("[quick-templates GET]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const parse = AddTemplateSchema.safeParse(await req.json().catch(() => null));
	if (!parse.success)
		return NextResponse.json(
			{ error: parse.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);

	try {
		const data = await addTemplate(parse.data.category, parse.data.text);
		return NextResponse.json(data, { status: 201 });
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			(error as Error & { code?: string }).code === "23505"
		)
			return NextResponse.json(
				{ error: "Template already exists" },
				{ status: 409 },
			);
		const message = error instanceof Error ? error.message : "Database error";
		logger.error("[quick-templates POST]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const id = new URL(req.url).searchParams.get("id");
	if (!id || !/^[0-9a-f-]{36}$/.test(id))
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	try {
		const found = await deleteTemplate(id);
		if (!found)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(null, { status: 204 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		logger.error("[quick-templates DELETE]", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
