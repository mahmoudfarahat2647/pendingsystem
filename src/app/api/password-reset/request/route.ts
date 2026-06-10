import { type NextRequest, NextResponse } from "next/server";
import {
	checkAndApplyRateLimit,
	sendPasswordResetIfUserExists,
} from "@/services/passwordResetService";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
	success: true,
	message: "If that username exists, a reset link has been sent.",
};

export async function POST(request: NextRequest) {
	const start = Date.now();

	const ensureMinDelay = async () => {
		const elapsed = Date.now() - start;
		if (elapsed < 500) {
			await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
		}
	};

	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		request.headers.get("x-real-ip") ??
		"unknown";

	if (await checkAndApplyRateLimit(ip)) {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	let username: string;
	try {
		const body = await request.json();
		username = String(body.username ?? "")
			.toLowerCase()
			.trim();
	} catch {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	if (!username) {
		await ensureMinDelay();
		return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
	}

	try {
		await sendPasswordResetIfUserExists(username);
	} catch {
		// Swallow errors — always return generic response
	}

	await ensureMinDelay();
	return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
