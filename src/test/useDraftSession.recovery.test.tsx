import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DraftRecoverySnapshot } from "@/store/slices/draftSessionSlice";

const toastMocks = vi.hoisted(() => ({
	custom: vi.fn(),
	dismiss: vi.fn(),
	error: vi.fn(),
	success: vi.fn(),
	plain: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: Object.assign(toastMocks.plain, {
		custom: toastMocks.custom,
		dismiss: toastMocks.dismiss,
		error: toastMocks.error,
		success: toastMocks.success,
	}),
}));

const storeMocks = vi.hoisted(() => {
	const restoreFromRecovery = vi.fn();
	const discardDraft = vi.fn();
	return {
		restoreFromRecovery,
		discardDraft,
		state: {
			draftSession: {
				isActive: false,
				dirty: false,
				saving: false,
				saveError: null,
				past: [],
				future: [],
				pendingCommands: [],
				workspaceId: "workspace-under-test",
			},
			applyCommand: vi.fn(),
			undoDraft: vi.fn(),
			redoDraft: vi.fn(),
			restoreFromRecovery,
			discardDraft,
			getWorkingRows: vi.fn(),
			saveDraft: vi.fn(),
			lastCommandError: null,
			clearCommandError: vi.fn(),
			lastSaveResult: null,
			clearSaveResult: vi.fn(),
		},
	};
});

vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (state: typeof storeMocks.state) => unknown) =>
		selector(storeMocks.state),
}));

const adapterMocks = vi.hoisted(() => ({
	isStageLoaded: vi.fn().mockReturnValue(true),
}));

vi.mock("@/store/ordersQueryAdapter", () => ({
	getOrdersQueryAdapter: () => ({
		isStageLoaded: adapterMocks.isStageLoaded,
	}),
}));

vi.mock("@/hooks/queries/useSaveOrderMutation", () => ({
	useSaveOrderMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/hooks/queries/useBulkUpdateOrderStageMutation", () => ({
	useBulkUpdateOrderStageMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/hooks/queries/useBulkDeleteOrdersMutation", () => ({
	useBulkDeleteOrdersMutation: () => ({ mutateAsync: vi.fn() }),
}));

// `useDraftSession` keeps module-level state (recovery toast lock/dedupe keys) that
// only resets on effect cleanup, and some code paths (e.g. discarding a corrupted
// snapshot) return early without registering a cleanup function. Re-import the
// module fresh for every test so that state can't leak between cases.
async function loadHarness() {
	vi.resetModules();
	const { useDraftSession } = await import("@/hooks/useDraftSession");
	function HarnessComponent() {
		useDraftSession("orders");
		return null;
	}
	return HarnessComponent;
}

describe("useDraftSession recovery toast", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		adapterMocks.isStageLoaded.mockReturnValue(true);
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("clicking Restore with a corrupted snapshot surfaces a toast instead of throwing", async () => {
		const validSnapshot: DraftRecoverySnapshot = {
			workspaceId: "workspace-under-test",
			updatedAt: Date.now(),
			pendingCommands: [
				{
					type: "patchRow",
					id: "row-1",
					sourceStage: "orders",
					destinationStage: "orders",
					updates: { status: "Arrived" },
					previousValues: { status: "Pending" },
				},
			],
		};
		localStorage.setItem(
			"pending-sys-draft-v1",
			JSON.stringify(validSnapshot),
		);

		// restoreFromRecovery blows up at runtime (e.g. a shape that passed the
		// lenient schema but is unusable downstream) — the click handler must not
		// let this escape uncaught.
		storeMocks.restoreFromRecovery.mockImplementation(() => {
			throw new Error("corrupted snapshot");
		});

		let renderFn:
			| ((toastId: string | number) => React.ReactElement)
			| undefined;
		toastMocks.custom.mockImplementation((fn) => {
			renderFn = fn;
			return "toast-id";
		});

		const HarnessComponent = await loadHarness();

		act(() => {
			render(<HarnessComponent />);
		});

		expect(renderFn).toBeDefined();
		const element = renderFn?.("toast-id");
		expect(element).toBeDefined();

		const { getByText } = render(element as React.ReactElement);

		expect(() => {
			act(() => {
				getByText("Restore").click();
			});
		}).not.toThrow();

		expect(storeMocks.restoreFromRecovery).toHaveBeenCalledTimes(1);
		expect(toastMocks.error).toHaveBeenCalledWith(
			expect.stringContaining("Could not restore"),
		);
	});

	it("discards a corrupted (schema-invalid) recovery snapshot without offering restore", async () => {
		localStorage.setItem(
			"pending-sys-draft-v1",
			JSON.stringify({ garbage: true }),
		);

		const HarnessComponent = await loadHarness();

		act(() => {
			render(<HarnessComponent />);
		});

		expect(toastMocks.custom).not.toHaveBeenCalled();
		expect(localStorage.getItem("pending-sys-draft-v1")).toBeNull();
	});
});
