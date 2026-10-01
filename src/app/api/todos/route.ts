import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { CreateTodoSchema } from "@/schemas/todo.schema";
import { createTodoRepository } from "@/services/todos/todoRepository";

export const runtime = "nodejs";

function serverError(scope: string, error: unknown) {
	const message = error instanceof Error ? error.message : "Database error";
	logger.error(`[todos ${scope}]`, message);
	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		return NextResponse.json(await createTodoRepository().list());
	} catch (error: unknown) {
		return serverError("GET", error);
	}
}

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const parse = CreateTodoSchema.safeParse(await req.json().catch(() => null));
	if (!parse.success)
		return NextResponse.json(
			{ error: parse.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);

	try {
		const todo = await createTodoRepository().create(parse.data);
		return NextResponse.json(todo, { status: 201 });
	} catch (error: unknown) {
		return serverError("POST", error);
	}
}
