import { NextResponse } from "next/server";

import { pool } from "@/lib/postgres";

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
		},
	};

	try {
		const hasDatabaseConfig = Boolean(
			process.env.DATABASE_URL || process.env.PGHOST,
		);

		if (!hasDatabaseConfig) {
			health.checks.database = "missing_db_config";
			health.status = "degraded";
		} else {
			try {
				await pool.query("SELECT 1");
				health.checks.database = "ok";
			} catch (dbError) {
				health.checks.database = "error";
				health.status = "degraded";
				console.error("[Health Check] Database connectivity failed:", dbError);
			}
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
