import { captureException } from "@/lib/sentry";

export async function GET() {
	captureException(new Error("Sentry verification test — safe to ignore"), {
		test: true,
		timestamp: new Date().toISOString(),
	});
	return Response.json({ message: "Test error captured" });
}
