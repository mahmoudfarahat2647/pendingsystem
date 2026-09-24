import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import { toast } from "sonner";
import {
	type UseSearchResultsActionsArgs,
	useSearchResultsActions,
} from "@/components/shared/search/hooks/useSearchResultsActions";
import type { OrderStage } from "@/domain/order/orderStage";
import { getMoveToMainSourceStage } from "@/lib/orderStageTransitions";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

const row = (id: string, stage: OrderStage, extra: Partial<PendingRow> = {}) =>
	({ id, stage, noteHistory: "", ...extra }) as PendingRow;

describe("getMoveToMainSourceStage", () => {
	it.each([
		"call",
		"booking",
		"archive",
	] as const)("returns %s for a single-stage eligible selection", (stage) => {
		expect(getMoveToMainSourceStage([stage, stage])).toBe(stage);
	});

	it.each([
		"orders",
		"main",
		"freeze",
	] as const)("rejects %s selections", (stage) => {
		expect(getMoveToMainSourceStage([stage])).toBeNull();
	});

	it("rejects mixed-stage and empty selections", () => {
		expect(getMoveToMainSourceStage(["call", "booking"])).toBeNull();
		expect(getMoveToMainSourceStage(["archive", undefined])).toBeNull();
		expect(getMoveToMainSourceStage([])).toBeNull();
	});
});

describe("useSearchResultsActions — handleMoveToMainConfirm", () => {
	let mutateAsync: ReturnType<typeof vi.fn>;
	let setSelectedRows: ReturnType<typeof vi.fn>;
	let setShowMoveToMainModal: ReturnType<typeof vi.fn>;

	const setup = (
		selectedRows: PendingRow[],
		searchResults: PendingRow[] = selectedRows,
		moveToMainPermission = true,
	) => {
		const args = {
			selectedRows,
			setSelectedRows,
			isSameSource: true,
			activeStage: selectedRows[0]?.stage,
			searchResults,
			filteredResults: searchResults,
			mainData: [],
			ordersData: [],
			freezeData: [],
			partStatuses: [],
			saveOrderMutation: { mutateAsync },
			bulkStageMutations: {},
			deleteOrdersMutation: {},
			requestCallRelease: vi.fn(),
			clearFollowUpsForVins: vi.fn(),
			handleUpdateOrder: vi.fn(),
			setPendingSearchSelection: vi.fn(),
			setSearchTerm: vi.fn(),
			router: {},
			setShowBookingModal: vi.fn(),
			setShowArchiveModal: vi.fn(),
			setShowReorderModal: vi.fn(),
			reorderReason: "",
			setReorderReason: vi.fn(),
			moveToMainPermission,
			setShowMoveToMainModal,
		} as unknown as UseSearchResultsActionsArgs;
		return renderHook(() => useSearchResultsActions(args)).result.current;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		useAppStore.setState({ language: "en" });
		mutateAsync = vi.fn().mockResolvedValue({ id: "saved" });
		setSelectedRows = vi.fn();
		setShowMoveToMainModal = vi.fn();
	});

	it("saves each row through the guarded per-row mutation with sourceStage and reports success", async () => {
		const rows = [
			row("a", "archive", { archiveReason: "old", status: "Archived" }),
			row("b", "archive"),
		];
		const { handleMoveToMainConfirm } = setup(rows);

		await act(() => handleMoveToMainConfirm());

		expect(mutateAsync).toHaveBeenCalledTimes(2);
		expect(mutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "a",
				stage: "main",
				sourceStage: "archive",
				updates: expect.objectContaining({
					status: "Pending",
					archiveReason: null,
					archivedAt: null,
				}),
			}),
		);
		expect(setSelectedRows).toHaveBeenCalledWith([]);
		expect(setShowMoveToMainModal).toHaveBeenCalledWith(false);
		expect(toast.success).toHaveBeenCalledWith("2 line(s) moved to Main Sheet");
	});

	it("reports real moved/skipped/failed counts and keeps unresolved rows selected", async () => {
		const rows = [row("a", "call"), row("b", "call"), row("c", "call")];
		mutateAsync
			.mockResolvedValueOnce({ id: "a" }) // moved
			.mockResolvedValueOnce(null) // compare-and-set no-op → skipped
			.mockRejectedValueOnce(new Error("boom")); // failed
		const { handleMoveToMainConfirm } = setup(rows);

		await act(() => handleMoveToMainConfirm());

		expect(toast.warning).toHaveBeenCalledWith(
			"Moved 1 of 3 line(s) to Main Sheet: 1 skipped (changed elsewhere), 1 failed. Remaining lines stay selected.",
		);
		const updater = setSelectedRows.mock.calls[0]?.[0] as (
			prev: PendingRow[],
		) => PendingRow[];
		expect(updater(rows).map((r) => r.id)).toEqual(["b", "c"]);
	});

	it("skips stale rows that left the source stage without writing them", async () => {
		const selected = [row("a", "booking"), row("b", "booking")];
		// Row b was moved to archive by another session since it was selected.
		const fresh = [row("a", "booking"), row("b", "archive")];
		const { handleMoveToMainConfirm } = setup(selected, fresh);

		await act(() => handleMoveToMainConfirm());

		expect(mutateAsync).toHaveBeenCalledTimes(1);
		expect(mutateAsync).toHaveBeenCalledWith(
			expect.objectContaining({ id: "a", sourceStage: "booking" }),
		);
		expect(toast.warning).toHaveBeenCalledWith(
			"Moved 1 of 2 line(s) to Main Sheet: 1 skipped (changed elsewhere), 0 failed. Remaining lines stay selected.",
		);
	});

	it("reports when nothing moved because every row changed elsewhere", async () => {
		mutateAsync.mockResolvedValue(null);
		const { handleMoveToMainConfirm } = setup([row("a", "call")]);

		await act(() => handleMoveToMainConfirm());

		expect(toast.warning).toHaveBeenCalledWith(
			"No lines were moved — they may have already been moved by another session.",
		);
		expect(setSelectedRows).not.toHaveBeenCalled();
	});

	it("aborts without writing when the switch is off", async () => {
		const { handleMoveToMainConfirm } = setup(
			[row("a", "call")],
			undefined,
			false,
		);

		await act(() => handleMoveToMainConfirm());

		expect(mutateAsync).not.toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith(
			"Move to Main Sheet is turned off in Settings. No lines were moved.",
		);
	});

	it.each([
		["orders", [row("a", "orders")]],
		["freeze", [row("a", "freeze")]],
		["mixed", [row("a", "call"), row("b", "booking")]],
	] as const)("never writes an ineligible %s selection", async (_label, rows) => {
		const { handleMoveToMainConfirm } = setup([...rows]);
		await act(() => handleMoveToMainConfirm());
		expect(mutateAsync).not.toHaveBeenCalled();
	});

	it("uses Arabic feedback when the language is Arabic", async () => {
		useAppStore.setState({ language: "ar" });
		const { handleMoveToMainConfirm } = setup([row("a", "call")]);

		await act(() => handleMoveToMainConfirm());

		expect(toast.success).toHaveBeenCalledWith("تم نقل 1 سطر إلى Main Sheet");
	});
});
