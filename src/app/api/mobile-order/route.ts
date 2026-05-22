import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { MobileQuickOrderSchema } from "@/schemas/mobileOrder.schema";
import { mobileOrderService } from "@/services/mobileOrderService";
import { isRateLimited } from "./rateLimiter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
		req.headers.get("x-real-ip") ??
		"unknown";

	const supabase = createServiceClient();

	if (await isRateLimited(supabase, ip)) {
		return NextResponse.json(
			{ error: "Too many requests. Try again later." },
			{ status: 429 },
		);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = MobileQuickOrderSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 400 },
		);
	}

	const { errors, inserted } = await mobileOrderService.createOrders(
		supabase,
		parsed.data,
	);

	if (errors.length > 0 && inserted === 0) {
		return NextResponse.json({ error: "All inserts failed" }, { status: 500 });
	}

	return NextResponse.json({ success: true, inserted });
}
