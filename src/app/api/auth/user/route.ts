import { createClient } from "@/lib/supabase-server";
import { isAllowedEmail } from "@/lib/validations";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error || !user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 },
			);
		}

		if (!isAllowedEmail(user.email)) {
			await supabase.auth.signOut();
			return NextResponse.json(
				{ success: false, error: "Forbidden" },
				{ status: 403 },
			);
		}

		return NextResponse.json(
			{ success: true, user: { id: user.id, email: user.email ?? "" } },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Auth user error:", error);
		return NextResponse.json(
			{ success: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}
}
