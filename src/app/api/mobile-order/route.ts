import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeNullableCompanyName } from "@/lib/company";
import { MobileQuickOrderSchema } from "@/schemas/mobileOrder.schema";

export const runtime = "nodejs";

function createServiceClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error("Missing Supabase service config");
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

function todayString(): string {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

export async function POST(req: NextRequest) {
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

	const {
		customerName,
		company,
		vin,
		mobile,
		sabNumber,
		model,
		repairSystem,
		parts,
	} = parsed.data;

	const rDate = todayString();
	const sharedIdentity = {
		customer_name: customerName || null,
		customer_phone: mobile || null,
		vin: vin || null,
		company: normalizeNullableCompanyName(company) as string,
	};

	const sharedMetadata = {
		requester: "mobile",
		status: "Pending",
		stage: "orders",
		sabNumber,
		model,
		repairSystem,
		rDate,
		sourceType: "mobile",
	};

	// If no valid parts, insert one blank row so the intake appears on desktop.
	const rowsToInsert =
		parts.length === 0 ? [{ partNumber: "", description: "" }] : parts;

	const supabase = createServiceClient();
	const errors: string[] = [];

	for (const part of rowsToInsert) {
		const partId = crypto.randomUUID();
		const partEntry = {
			id: partId,
			partNumber: part.partNumber,
			description: part.description,
		};
		const row = {
			...sharedIdentity,
			stage: "orders",
			metadata: {
				...sharedMetadata,
				parts: [partEntry],
				partNumber: part.partNumber,
				description: part.description,
			},
		};

		const { error } = await supabase
			.from("orders")
			.insert([row])
			.select()
			.single();

		if (error) {
			console.error("[mobile-order] insert error:", error.message);
			errors.push(error.message);
		}
	}

	if (errors.length > 0 && errors.length === rowsToInsert.length) {
		return NextResponse.json({ error: "All inserts failed" }, { status: 500 });
	}

	return NextResponse.json({
		success: true,
		inserted: rowsToInsert.length - errors.length,
	});
}
