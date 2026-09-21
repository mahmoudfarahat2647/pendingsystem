import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
	AddTemplateSchema,
	QuickTemplateScopeSchema,
} from "@/schemas/quickTemplates.schema";
import {
	addTemplate,
	deleteTemplate,
	getTemplates,
} from "@/services/quickTemplatesRepository";

export const runtime = "nodejs";

function parseScope(searchParams: URLSearchParams) {
	return QuickTemplateScopeSchema.safeParse({
		category: searchParams.get("category"),
		stage: searchParams.get("stage") ?? undefined,
	});
}

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const scopeParse = parseScope(new URL(req.url).searchParams);
	if (!scopeParse.success)
		return NextResponse.json(
			{ error: scopeParse.error.issues[0]?.message ?? "Invalid scope" },
			{ status: 400 },
		);

	try {
		const { category, stage } = scopeParse.data;
		return NextResponse.json(await getTemplates(category, stage));
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		logger.error("[quick-templates GET]", message);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
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
		const { category, text, stage } = parse.data;
		const data = await addTemplate(category, text, stage);
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
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const searchParams = new URL(req.url).searchParams;
	const id = searchParams.get("id");
	if (!id || !/^[0-9a-f-]{36}$/.test(id))
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	const scopeParse = parseScope(searchParams);
	if (!scopeParse.success)
		return NextResponse.json(
			{ error: scopeParse.error.issues[0]?.message ?? "Invalid scope" },
			{ status: 400 },
		);

	try {
		const { category, stage } = scopeParse.data;
		const found = await deleteTemplate(id, category, stage);
		if (!found)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(null, { status: 204 });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Database error";
		logger.error("[quick-templates DELETE]", message);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
