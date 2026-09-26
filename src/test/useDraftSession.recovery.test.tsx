import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReleaseGateContext } from "@/hooks/useReleaseGate";
import type {
	DraftCommand,
	DraftRecoverySnapshot,
} from "@/store/slices/draftSessionSlice";

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
				saveError: null as string | null,
				past: [] as DraftCommand[],
				future: [] as DraftCommand[],
				pendingCommands: [] as DraftCommand[],
				workspaceId: "workspace-under-test",
				saveCheckpoint: null as {
					nextIndex: number;
					idMapEntries: [string, string][];
				} | null,
				saveBlockedIndex: null as number | null,
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

vi.mock("@/store/useStore", () => {
	const mockStore = (selector: (state: typeof storeMocks.state) => unknown) =>
		selector(storeMocks.state);
	mockStore.getState = () => storeMocks.state;
	return { useAppStore: mockStore };
});

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
		localStorage.setItem("pending-sys-draft-v1", JSON.stringify(validSnapshot));

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

	it("does not clear release follow-ups when preflight fails before persisting commands (Issue #317)", async () => {
		const clearFollowUpsForVins = vi.fn();
		const vin1 = "VF1RFA00000000001";
		storeMocks.state.draftSession = {
			...storeMocks.state.draftSession,
			isActive: true,
			dirty: true,
			saveError: null,
			saveCheckpoint: null,
			saveBlockedIndex: null,
			pendingCommands: [
				{
					type: "moveRows",
					ids: ["row-1"],
					sourceStage: "main",
					destinationStage: "call",
					releaseAuthorization: {
						fingerprint: "fp1",
						vins: [vin1],
						grantedAt: Date.now(),
					},
				},
				{
					type: "moveRows",
					ids: ["row-2"],
					sourceStage: "main",
					destinationStage: "call",
					releaseAuthorization: {
						fingerprint: "stale-fp",
						vins: ["VF1RFA00000000002"],
						grantedAt: Date.now(),
					},
				},
			],
		};

		storeMocks.state.saveDraft = vi.fn().mockImplementation(async () => {
			storeMocks.state.draftSession = {
				...storeMocks.state.draftSession,
				saveError: "Release authorization became stale before save...",
				saveCheckpoint: { nextIndex: 0, idMapEntries: [] },
				saveBlockedIndex: 1,
			};
		});

		vi.resetModules();
		const { useDraftSession } = await import("@/hooks/useDraftSession");
		let capturedSaveDraft: (() => Promise<void>) | undefined;
		function HarnessComponent() {
			const { saveDraft } = useDraftSession("orders");
			capturedSaveDraft = saveDraft;
			return null;
		}

		render(
			<ReleaseGateContext.Provider
				value={{
					requestCallRelease: vi.fn(),
					clearFollowUpsForVins,
				}}
			>
				<HarnessComponent />
			</ReleaseGateContext.Provider>,
		);

		await act(async () => {
			await capturedSaveDraft?.();
		});

		expect(clearFollowUpsForVins).not.toHaveBeenCalled();
	});
});
