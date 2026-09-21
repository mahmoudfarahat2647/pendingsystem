import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			body,
			status: init?.status ?? 200,
		}),
	},
	NextRequest: class {},
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(() => Promise.resolve(new Headers())),
}));

const mockTriggerGithubBackup = vi.fn();
vi.mock("@/services/backupService", () => ({
	triggerGithubBackup: (...args: unknown[]) => mockTriggerGithubBackup(...args),
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

type ErrorBody = {
	success: false;
	error: { code: string; message: string };
};

function failedBackupError(message: string, code: string, status: number) {
	const err = new Error(message) as Error & { code: string; status: number };
	err.code = code;
	err.status = status;
	return err;
}

describe("POST /api/trigger-backup", () => {
	beforeEach(() => {
		vi.resetModules();
		mockTriggerGithubBackup.mockReset();
	});

	it("returns 401 when not authenticated", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const { POST } = await import("../app/api/trigger-backup/route");
		const res = await POST();
		expect(res.status).toBe(401);
	});

	it("returns success when the workflow dispatch succeeds", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);
		mockTriggerGithubBackup.mockResolvedValue(undefined);

		const { POST } = await import("../app/api/trigger-backup/route");
		const res = await POST();
		expect(res.status).toBe(200);
	});

	it("returns a generic 500 body without leaking server config internals", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);
		const rawMessage = "Server configuration error: Missing GITHUB_PAT";
		mockTriggerGithubBackup.mockRejectedValue(
			failedBackupError(rawMessage, "SERVER_ERROR", 500),
		);

		const { POST } = await import("../app/api/trigger-backup/route");
		const res = await POST();
		expect(res.status).toBe(500);
		const body = res.body as unknown as ErrorBody;
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("SERVER_ERROR");
		expect(body.error.message).toBe("Internal server error");
		expect(JSON.stringify(body)).not.toContain("GITHUB_PAT");

		const { logger } = await import("@/lib/logger");
		expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
			"Backup trigger error:",
			rawMessage,
		);
	});

	it("returns a generic 500 body without leaking GitHub internals", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);
		const rawMessage = "GitHub trigger failed: Bad credentials";
		mockTriggerGithubBackup.mockRejectedValue(
			failedBackupError(rawMessage, "EXTERNAL_SERVICE_ERROR", 502),
		);

		const { POST } = await import("../app/api/trigger-backup/route");
		const res = await POST();
		expect(res.status).toBe(502);
		const body = res.body as unknown as ErrorBody;
		expect(body.error.code).toBe("EXTERNAL_SERVICE_ERROR");
		expect(body.error.message).toBe("Internal server error");
		expect(JSON.stringify(body)).not.toContain("Bad credentials");
	});

	it("leaves 4xx behavior untouched", async () => {
		const { auth } = await import("@/lib/auth");
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u1" },
		} as never);
		mockTriggerGithubBackup.mockRejectedValue(
			failedBackupError(
				"Workflow not found. Ensure backup-reports.yml is committed to the main branch.",
				"NOT_FOUND",
				404,
			),
		);

		const { POST } = await import("../app/api/trigger-backup/route");
		const res = await POST();
		expect(res.status).toBe(404);
		const body = res.body as unknown as ErrorBody;
		expect(body.error.code).toBe("NOT_FOUND");
		expect(body.error.message).toContain("backup-reports.yml");
	});
});
