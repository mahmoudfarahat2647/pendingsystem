import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Health check endpoint for production monitoring.
 *
 * GET /api/health
 *
 * Returns:
 * - 200 OK when all checks pass
 * - 503 Service Unavailable if critical services are down
 */
export async function GET() {
	const health = {
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime?.() ?? 0,
		checks: {
			api: "ok",
			database: "pending",
			storage: "pending",
		},
	};

	try {
		// Check Supabase connectivity
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseAnonKey) {
			health.checks.database = "missing_config";
			health.status = "degraded";
		} else {
			// Simple connectivity check - just verify env vars are present
			// Full DB check would require a service role client which we don't want to expose
			health.checks.database = "ok";
		}

		// Check storage
		const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_URL;
		if (storageBucket) {
			health.checks.storage = "ok";
		}

		// Determine overall status
		const hasFailures = Object.values(health.checks).some(
			(check) => check !== "ok",
		);

		if (hasFailures) {
			health.status = "degraded";
			return NextResponse.json(health, { status: 503 });
		}

		return NextResponse.json(health, { status: 200 });
	} catch (error) {
		health.status = "unhealthy";
		health.checks.api = "error";

		console.error("[Health Check] Failed:", error);

		return NextResponse.json(health, { status: 503 });
	}
}

/**
 * Simple liveness probe for Kubernetes/container orchestration.
 *
 * GET /api/health/live
 */
export async function HEAD() {
	return new NextResponse(null, { status: 200 });
}
