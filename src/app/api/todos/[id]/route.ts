import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { TodoIdSchema, UpdateTodoSchema } from "@/schemas/todo.schema";
import {
	createTodoRepository,
	TodoNotFoundError,
} from "@/services/todos/todoRepository";

export const runtime = "nodejs";

interface RouteContext {
	params: Promise<{ id: string }>;
}

function errorResponse(scope: string, error: unknown) {
	if (error instanceof TodoNotFoundError)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	const message = error instanceof Error ? error.message : "Database error";
	logger.error(`[todos ${scope}]`, message);
	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const id = TodoIdSchema.safeParse((await params).id);
	if (!id.success)
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	const parse = UpdateTodoSchema.safeParse(await req.json().catch(() => null));
	if (!parse.success)
		return NextResponse.json(
			{ error: parse.error.issues[0]?.message ?? "Invalid body" },
			{ status: 400 },
		);

	try {
		const todo = await createTodoRepository().update(id.data, parse.data);
		return NextResponse.json(todo);
	} catch (error: unknown) {
		return errorResponse("PATCH", error);
	}
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const id = TodoIdSchema.safeParse((await params).id);
	if (!id.success)
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	try {
		await createTodoRepository().remove(id.data);
		return new NextResponse(null, { status: 204 });
	} catch (error: unknown) {
		return errorResponse("DELETE", error);
	}
}
