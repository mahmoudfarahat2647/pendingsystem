import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "../lib/auth";
import { createClient } from "../lib/supabase-server";
import { ALLOWED_USER_EMAIL } from "../lib/validations";

vi.mock("../lib/supabase-server", () => ({
	createClient: vi.fn(),
}));

describe("getCurrentUser", () => {
	const createClientMock = vi.mocked(createClient);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return null when user is null", async () => {
		createClientMock.mockResolvedValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
			},
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await getCurrentUser();

		expect(result).toBeNull();
	});

	it("should return null when user email is undefined", async () => {
		createClientMock.mockResolvedValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: "user-1", email: undefined } },
				}),
			},
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await getCurrentUser();

		expect(result).toBeNull();
	});

	it("should return user when email is allowed", async () => {
		createClientMock.mockResolvedValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: "user-2", email: ALLOWED_USER_EMAIL } },
				}),
			},
		} as unknown as Awaited<ReturnType<typeof createClient>>);

		const result = await getCurrentUser();

		expect(result).toEqual({ id: "user-2", email: ALLOWED_USER_EMAIL });
	});
});
