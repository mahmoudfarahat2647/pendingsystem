import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const functionUrl = `${supabaseUrl}/functions/v1/backup-reports`;

        if (serviceRoleKey) {
            console.log("Service Key loaded (prefix):", serviceRoleKey.substring(0, 5) + "...");
        }

        const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ action: "manual_backup" }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Edge function error:", response.status, errorText);
            return NextResponse.json(
                { error: `Function failed: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Backup trigger error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
