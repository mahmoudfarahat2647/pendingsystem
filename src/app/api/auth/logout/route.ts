import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Logout API endpoint.
 * Clears the user's session by signing them out of Supabase.
 */
export async function POST() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { success: false, error: "Logout failed" },
            { status: 500 },
        );
    }
}
