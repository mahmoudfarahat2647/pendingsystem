import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderStage } from "@/domain/order/orderStage";
import { ORDER_STAGE_TAB_INFO } from "@/lib/orderStage";
import type { DraftCommand } from "@/store/slices/draftSessionCommands";
import { useAppStore } from "@/store/useStore";
import type { AppNotification, PendingRow } from "@/types";

const routerPush = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: routerPush }),
}));

vi.mock("sonner", () => ({
	toast: { error: (...args: unknown[]) => toastError(...args) },
}));

vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	motion: {
		div: ({
			children,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & {
			children?: React.ReactNode;
		}) => <div {...props}>{children}</div>,
	},
}));

import {
	NotificationsDropdown,
	resolveNotificationStage,
} from "@/components/shared/NotificationsDropdown";

const ALL_STAGES: OrderStage[] = [
	"orders",
	"main",
	"call",
	"booking",
	"archive",
];

const createRow = (id: string, stage: OrderStage): PendingRow =>
	({
		id,
		baseId: `B${id}`,
		trackingId: `T${id}`,
		customerName: "Test",
		vin: `VIN${id}`,
		mobile: "123",
		cntrRdg: 0,
		model: "M",
		parts: [],
		sabNumber: "",
		acceptedBy: "",
		requester: "",
		partNumber: "P1",
		description: "D",
		quantity: 1,
		status: "",
		rDate: "",
		repairSystem: "",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		stage,
	}) as PendingRow;

const createReminderNotification = (
	overrides: Partial<AppNotification> = {},
): AppNotification => ({
	id: "notif-1",
	type: "reminder",
	title: "Reminder Due",
	description: "Due",
	referenceId: "row-1",
	vin: "VIN1",
	trackingId: "T1",
	tabName: "Main Sheet",
	path: "/main-sheet",
	timestamp: new Date().toISOString(),
	isRead: false,
	managedKey: "reminder:row-1:2026-01-01:10:00:x",
	...overrides,
});

function stubWorkingRows(
	byStage: Partial<Record<OrderStage, PendingRow[] | undefined>>,
) {
	useAppStore.setState({
		getWorkingRows: (stage: OrderStage) => byStage[stage],
	});
}

function stubAllStagesEmpty() {
	stubWorkingRows({
		orders: [],
		main: [],
		call: [],
		booking: [],
		archive: [],
	});
}

function resetDraftSessionInactive() {
	const current = useAppStore.getState().draftSession;
	useAppStore.setState({
		draftSession: {
			...current,
			isActive: false,
			pendingCommands: [],
		},
	});
}

describe("resolveNotificationStage", () => {
	beforeEach(() => {
		resetDraftSessionInactive();
		stubWorkingRows({});
	});

	it("finds the stage that currently holds the row (draft move main→call)", () => {
		stubWorkingRows({
			main: [],
			call: [createRow("row-1", "call")],
		});
		expect(resolveNotificationStage("row-1")).toBe("call");
	});

	it("finds the saved stage even when notification still stamped main", () => {
		stubWorkingRows({
			main: [],
			call: [createRow("row-1", "call")],
		});
		expect(resolveNotificationStage("row-1")).toBe("call");
	});

	it("returns undefined when the row is missing from every stage", () => {
		stubWorkingRows({
			main: [createRow("other", "main")],
		});
		expect(resolveNotificationStage("row-1")).toBeUndefined();
	});

	it("prefers a loaded call cache over a stale /main-sheet path", () => {
		stubWorkingRows({
			call: [createRow("row-1", "call")],
		});
		expect(resolveNotificationStage("row-1", "/main-sheet")).toBe("call");
	});

	it("prefers an unsaved draft move in working rows over the notification path", () => {
		stubWorkingRows({
			main: [],
			call: [createRow("row-1", "call")],
		});
		expect(resolveNotificationStage("row-1", "/main-sheet")).toBe("call");
	});

	it("falls back to each canonical path when all stage caches are unloaded", () => {
		stubWorkingRows({});
		for (const stage of ALL_STAGES) {
			expect(
				resolveNotificationStage("row-1", ORDER_STAGE_TAB_INFO[stage].path),
			).toBe(stage);
		}
	});

	it("returns undefined when all caches are loaded, row is absent, and draft is inactive", () => {
		stubAllStagesEmpty();
		expect(resolveNotificationStage("row-1", "/main-sheet")).toBeUndefined();
	});

	it("falls back to path during an active draft even when every stage returns an array", () => {
		useAppStore.setState({
			draftSession: {
				...useAppStore.getState().draftSession,
				isActive: true,
				pendingCommands: [{} as DraftCommand],
			},
		});
		stubAllStagesEmpty();
		expect(resolveNotificationStage("row-1", "/booking")).toBe("booking");
	});

	it("returns undefined for an unknown path when coverage is incomplete", () => {
		stubWorkingRows({});
		expect(resolveNotificationStage("row-1", "/unknown")).toBeUndefined();
	});

	it("returns undefined when coverage is incomplete and no path is provided", () => {
		stubWorkingRows({});
		expect(resolveNotificationStage("row-1")).toBeUndefined();
	});
});

describe("NotificationsDropdown click-time navigation", () => {
	beforeEach(() => {
		routerPush.mockReset();
		toastError.mockReset();
		resetDraftSessionInactive();
		useAppStore.setState({
			notifications: [createReminderNotification()],
			highlightedRowId: null,
			markNotificationAsRead: vi.fn(),
			clearNotifications: vi.fn(),
			removeNotification: vi.fn(),
			setPendingVinSelection: vi.fn(),
		});
		stubWorkingRows({});
	});

	async function openAndClickNotification() {
		const user = userEvent.setup();
		render(<NotificationsDropdown />);
		await user.click(screen.getByTitle("Notifications"));
		await user.click(screen.getByText("Reminder Due"));
	}

	it("navigates to /call-list when the live stage is call (draft move)", async () => {
		stubWorkingRows({
			main: [],
			call: [createRow("row-1", "call")],
		});

		await openAndClickNotification();

		expect(routerPush).toHaveBeenCalledWith("/call-list");
		expect(useAppStore.getState().highlightedRowId).toEqual({
			stage: "call",
			id: "row-1",
		});
		expect(toastError).not.toHaveBeenCalled();
	});

	it("navigates to /call-list when notification path is still /main-sheet after a saved move", async () => {
		useAppStore.setState({
			notifications: [
				createReminderNotification({
					path: "/main-sheet",
					tabName: "Main Sheet",
				}),
			],
		});
		stubWorkingRows({
			call: [createRow("row-1", "call")],
		});

		await openAndClickNotification();

		expect(routerPush).toHaveBeenCalledWith("/call-list");
		expect(routerPush).not.toHaveBeenCalledWith("/main-sheet");
		expect(useAppStore.getState().highlightedRowId).toEqual({
			stage: "call",
			id: "row-1",
		});
	});

	it("skips navigation and toasts when the row is not in any stage", async () => {
		stubAllStagesEmpty();

		await openAndClickNotification();

		expect(routerPush).not.toHaveBeenCalled();
		expect(useAppStore.getState().highlightedRowId).toBeNull();
		expect(toastError).toHaveBeenCalledWith("Order no longer available");
	});

	it("navigates via path fallback when all stage caches are unloaded (Dashboard)", async () => {
		useAppStore.setState({
			notifications: [
				createReminderNotification({
					path: "/booking",
					tabName: "Booking",
				}),
			],
		});
		stubWorkingRows({});

		await openAndClickNotification();

		expect(routerPush).toHaveBeenCalledWith("/booking");
		expect(useAppStore.getState().highlightedRowId).toEqual({
			stage: "booking",
			id: "row-1",
		});
		expect(toastError).not.toHaveBeenCalled();
	});

	it("navigates to live call stage over a stale /main-sheet notification path", async () => {
		useAppStore.setState({
			notifications: [
				createReminderNotification({
					path: "/main-sheet",
					tabName: "Main Sheet",
				}),
			],
		});
		stubWorkingRows({
			call: [createRow("row-1", "call")],
		});

		await openAndClickNotification();

		expect(routerPush).toHaveBeenCalledWith("/call-list");
	});

	it("toasts when all caches are loaded empty even with a valid path", async () => {
		stubAllStagesEmpty();

		await openAndClickNotification();

		expect(routerPush).not.toHaveBeenCalled();
		expect(toastError).toHaveBeenCalledWith("Order no longer available");
	});

	it("leaves booking_followup on the VIN path unchanged", async () => {
		const user = userEvent.setup();
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			...navigator,
			clipboard: { writeText },
		});

		useAppStore.setState({
			notifications: [
				createReminderNotification({
					id: "follow-1",
					type: "booking_followup",
					title: "Booking Follow-up",
					path: "/booking",
					tabName: "Booking",
					bookingDate: "2026-03-01",
				}),
			],
		});

		render(<NotificationsDropdown />);
		await user.click(screen.getByTitle("Notifications"));
		await user.click(screen.getByText("Booking Follow-up"));

		expect(routerPush).toHaveBeenCalledWith("/booking");
		expect(writeText).toHaveBeenCalledWith("VIN1");
		expect(useAppStore.getState().highlightedRowId).toBeNull();
	});
});
