import { createClient } from "@/lib/supabase-server";
import { isAllowedEmail } from "@/lib/validations";
import { NextResponse } from "next/server";

interface SessionPayload {
	access_token: string;
	refresh_token: string;
}

/**
 * Establishes a server-side Supabase session from client tokens.
 * This ensures cookies are set in the HTTP response for middleware auth.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<SessionPayload>;

		if (!body.access_token || !body.refresh_token) {
			return NextResponse.json(
				{ success: false, error: "Missing session tokens" },
				{ status: 400 },
			);
		}

		const supabase = await createClient();
		const { data, error } = await supabase.auth.setSession({
			access_token: body.access_token,
			refresh_token: body.refresh_token,
		});

		if (error || !data.user) {
			return NextResponse.json(
				{ success: false, error: "Session could not be established" },
				{ status: 401 },
			);
		}

		if (!isAllowedEmail(data.user.email)) {
			await supabase.auth.signOut();
			return NextResponse.json(
				{ success: false, error: "Unauthorized email address" },
				{ status: 403 },
			);
		}

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Session establish error:", error);
		return NextResponse.json(
			{ success: false, error: "Session establish failed" },
			{ status: 500 },
		);
	}
}
