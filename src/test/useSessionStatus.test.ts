import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authClientMocks = vi.hoisted(() => ({
	useSession: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: authClientMocks.useSession,
	},
}));

import { useSessionStatus } from "../hooks/useSessionStatus";

describe("useSessionStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-17T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not resubscribe when the session expiry stays the same", () => {
		authClientMocks.useSession.mockReturnValue({
			data: {
				session: {
					expiresAt: "2026-04-17T12:10:00.000Z",
				},
			},
			isPending: false,
		});

		const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

		const { result, rerender, unmount } = renderHook(() => useSessionStatus());

		expect(result.current.status).toBe("active");
		expect(result.current.secondsRemaining).toBe(600);
		expect(setIntervalSpy).toHaveBeenCalledTimes(1);

		rerender();

		expect(result.current.status).toBe("active");
		expect(setIntervalSpy).toHaveBeenCalledTimes(1);

		unmount();

		expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
	});
});
