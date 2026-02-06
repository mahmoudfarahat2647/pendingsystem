import { createClient } from "@/lib/supabase-server";
import { isAllowedEmail, loginSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface LoginPayload {
	email: string;
	password: string;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<LoginPayload>;
		const result = loginSchema.safeParse(body);

		if (!result.success) {
			const errors = result.error.issues.map((err) => err.message).join(", ");
			return NextResponse.json(
				{ success: false, error: errors },
				{ status: 400 },
			);
		}

		const { email, password } = result.data;
		const supabase = await createClient();
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error || !data.user) {
			return NextResponse.json(
				{ success: false, error: error?.message ?? "Invalid credentials" },
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

		return NextResponse.json(
			{
				success: true,
				user: { id: data.user.id, email: data.user.email ?? email },
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ success: false, error: "Login failed" },
			{ status: 500 },
		);
	}
}
