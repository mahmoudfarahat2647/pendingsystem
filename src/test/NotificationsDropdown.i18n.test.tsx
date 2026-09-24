import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { useAppStore } from "@/store/useStore";
import type { AppNotification } from "@/types";

const navigationMocks = vi.hoisted(() => ({
	pathname: "/orders",
	push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => navigationMocks.pathname,
	useRouter: () => ({
		push: navigationMocks.push,
		replace: vi.fn(),
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

vi.mock("@/hooks/queries/useReleaseFollowUpsQuery", () => ({
	useUpsertReleaseFollowUpMutation: () => ({
		mutateAsync: vi.fn().mockResolvedValue({}),
	}),
}));

function renderWithProviders(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { ...render(ui, { wrapper }), queryClient };
}

const createTestNotification = (
	overrides: Partial<AppNotification>,
): AppNotification => ({
	id: `notif-${Math.random()}`,
	type: "reminder",
	timestamp: new Date().toISOString(),
	isRead: false,
	referenceId: "row-1",
	vin: "TESTVIN123",
	trackingId: "TRK-001",
	tabName: "Orders",
	path: "/orders",
	...overrides,
});

describe("NotificationsDropdown i18n (Wave 3)", () => {
	beforeEach(() => {
		useAppStore.getState().setLanguage("en");
		useAppStore.setState({ notifications: [] });
	});

	afterEach(() => {
		useAppStore.getState().setLanguage("en");
		useAppStore.setState({ notifications: [] });
	});

	describe("Bell button & empty state", () => {
		it("renders English bell tooltip and empty message by default", async () => {
			const user = userEvent.setup();
			renderWithProviders(<NotificationsDropdown />);

			const bell = screen.getByTitle("Notifications");
			expect(bell).toBeInTheDocument();

			await user.click(bell);
			expect(screen.getByText("Notifications")).toBeInTheDocument();
			expect(screen.getByText("No notifications yet")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Close notifications" }),
			).toBeInTheDocument();
		});

		it("renders Arabic bell tooltip and empty message in AR mode", async () => {
			const user = userEvent.setup();
			useAppStore.getState().setLanguage("ar");
			renderWithProviders(<NotificationsDropdown />);

			const bell = screen.getByTitle("الإشعارات");
			expect(bell).toBeInTheDocument();

			await user.click(bell);
			expect(screen.getByText("الإشعارات")).toBeInTheDocument();
			expect(screen.getByText("لا توجد إشعارات بعد")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "إغلاق الإشعارات" }),
			).toBeInTheDocument();
		});

		it("renders Clear All in English and Arabic", async () => {
			const user = userEvent.setup();
			useAppStore.setState({
				notifications: [
					createTestNotification({
						type: "reminder",
						titleKey: "notifications.reminderTitle",
						descriptionKey: "notifications.reminderDescription",
						params: {
							date: "2026-05-01",
							time: "10:00",
							customer: "Ahmed",
							subject: "Oil change",
						},
					}),
				],
			});

			const { unmount } = renderWithProviders(<NotificationsDropdown />);
			let bell = screen.getByTitle("Notifications");
			await user.click(bell);
			expect(screen.getByText("Clear All")).toBeInTheDocument();
			unmount();

			useAppStore.getState().setLanguage("ar");
			renderWithProviders(<NotificationsDropdown />);
			bell = screen.getByTitle("الإشعارات");
			await user.click(bell);
			expect(screen.getByText("مسح الكل")).toBeInTheDocument();
		});
	});

	describe("All 5 notification types rendering (EN vs AR)", () => {
		const reminderNotif = createTestNotification({
			id: "n-reminder",
			type: "reminder",
			titleKey: "notifications.reminderTitle",
			descriptionKey: "notifications.reminderDescription",
			params: {
				date: "2026-05-01",
				time: "10:00",
				customer: "Tariq",
				subject: "Check brakes",
			},
		});

		const warrantyNotif = createTestNotification({
			id: "n-warranty",
			type: "warranty",
			titleKey: "notifications.warrantyTitle",
			descriptionKey: "notifications.warrantyDescription",
			params: {
				days: 5,
				date: "2026-05-15",
			},
		});

		const bookingNotif = createTestNotification({
			id: "n-booking",
			type: "booking_followup",
			titleKey: "notifications.bookingFollowUpTitle",
			descriptionKey: "notifications.bookingFollowUpDescription",
			params: {
				customer: "Salim",
				vin: "VF1AR00001",
			},
		});

		const cntrHighNotif = createTestNotification({
			id: "n-cntr-high",
			type: "cntr_rdg_warning",
			cntrRdgLevel: "high",
			titleKey: "notifications.cntrWarningHighTitle",
			descriptionKey: "notifications.cntrWarningDescription",
			params: {
				customer: "Karim",
				km: "85,000",
				vin: "VF1AR00002",
			},
		});

		const cntrEarlyNotif = createTestNotification({
			id: "n-cntr-early",
			type: "cntr_rdg_warning",
			cntrRdgLevel: "early",
			titleKey: "notifications.cntrWarningEarlyTitle",
			descriptionKey: "notifications.cntrWarningDescription",
			params: {
				customer: "Mahmoud",
				km: "70,000",
				vin: "VF1AR00003",
			},
		});

		const releaseNotif = createTestNotification({
			id: "n-release",
			type: "release_followup",
			titleKey: "notifications.releaseFollowUpTitle",
			descriptionKey: "notifications.releaseFollowUpDescription",
			params: {
				vin: "VF1AR00004",
			},
		});

		it("renders all types correctly in English", async () => {
			const user = userEvent.setup();
			useAppStore.setState({
				notifications: [
					reminderNotif,
					warrantyNotif,
					bookingNotif,
					cntrHighNotif,
					cntrEarlyNotif,
					releaseNotif,
				],
			});

			renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("Notifications"));

			// Reminder
			expect(screen.getByText("Reminder Due")).toBeInTheDocument();
			expect(
				screen.getByText("Due: 2026-05-01 10:00 - Tariq: Check brakes"),
			).toBeInTheDocument();

			// Warranty
			expect(screen.getByText("Warranty Expiring")).toBeInTheDocument();
			expect(
				screen.getByText("Warranty expires in 5 days (2026-05-15)"),
			).toBeInTheDocument();

			// Booking
			expect(screen.getByText("Booking Follow-up")).toBeInTheDocument();
			expect(screen.getByText("Salim — VIN VF1AR00001")).toBeInTheDocument();

			// CNTR High & Early
			expect(
				screen.getByText("High Risk: CNTR RDG Warning"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Karim — 85,000 KM (VIN: VF1AR00002)"),
			).toBeInTheDocument();
			expect(screen.getByText("Early Warning: CNTR RDG")).toBeInTheDocument();
			expect(
				screen.getByText("Mahmoud — 70,000 KM (VIN: VF1AR00003)"),
			).toBeInTheDocument();

			// Release follow-up
			expect(screen.getByText("Release Follow-up Due")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Warranty chassis VIN VF1AR00004 may now be past 5,000 km — re-confirm release before moving to Call List.",
				),
			).toBeInTheDocument();

			// Action button tooltips
			expect(screen.getAllByTitle("Remove notification").length).toBe(5);
			expect(screen.getByTitle("Snooze for two months")).toBeInTheDocument();
		});

		it("renders all types correctly in Arabic", async () => {
			const user = userEvent.setup();
			useAppStore.getState().setLanguage("ar");
			useAppStore.setState({
				notifications: [
					reminderNotif,
					warrantyNotif,
					bookingNotif,
					cntrHighNotif,
					cntrEarlyNotif,
					releaseNotif,
				],
			});

			renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("الإشعارات"));

			// Reminder
			expect(screen.getByText("تذكير مستحق")).toBeInTheDocument();
			expect(
				screen.getByText(
					"موعد الاستحقاق: 2026-05-01 10:00 - Tariq: Check brakes",
				),
			).toBeInTheDocument();

			// Warranty
			expect(screen.getByText("الضمان على وشك الانتهاء")).toBeInTheDocument();
			expect(
				screen.getByText("ينتهي الضمان خلال 5 يوم (2026-05-15)"),
			).toBeInTheDocument();

			// Booking
			expect(screen.getByText("متابعة الحجز")).toBeInTheDocument();
			expect(screen.getByText("Salim — VIN VF1AR00001")).toBeInTheDocument();

			// CNTR High & Early
			expect(
				screen.getByText("خطورة عالية: تحذير قراءة العداد"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Karim — 85,000 KM (VIN: VF1AR00002)"),
			).toBeInTheDocument();
			expect(screen.getByText("تنبيه مبكر: قراءة العداد")).toBeInTheDocument();
			expect(
				screen.getByText("Mahmoud — 70,000 KM (VIN: VF1AR00003)"),
			).toBeInTheDocument();

			// Release follow-up
			expect(screen.getByText("متابعة الإفراج مستحقة")).toBeInTheDocument();
			expect(
				screen.getByText(
					"قد يكون الشاسيه VF1AR00004 (ضمان) قد تجاوز 5,000 كم — أعد تأكيد الإفراج قبل النقل إلى Call List.",
				),
			).toBeInTheDocument();

			// Action button tooltips
			expect(screen.getAllByTitle("إزالة الإشعار").length).toBe(5);
			expect(screen.getByTitle("تأجيل لمدة شهرين")).toBeInTheDocument();
		});

		it("switches language instantly when store language toggle changes", async () => {
			const user = userEvent.setup();
			useAppStore.setState({
				notifications: [reminderNotif, releaseNotif],
			});

			renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("Notifications"));

			// Initially English
			expect(screen.getByText("Notifications")).toBeInTheDocument();
			expect(screen.getByText("Reminder Due")).toBeInTheDocument();
			expect(screen.getByText("Release Follow-up Due")).toBeInTheDocument();

			// Toggle to Arabic while open
			act(() => {
				useAppStore.getState().setLanguage("ar");
			});

			// Switched instantly to Arabic
			expect(screen.queryByText("Notifications")).toBeNull();
			expect(screen.getByText("الإشعارات")).toBeInTheDocument();
			expect(screen.getByText("تذكير مستحق")).toBeInTheDocument();
			expect(screen.getByText("متابعة الإفراج مستحقة")).toBeInTheDocument();
			expect(
				screen.getByText(
					"موعد الاستحقاق: 2026-05-01 10:00 - Tariq: Check brakes",
				),
			).toBeInTheDocument();
			expect(screen.getByTitle("تأجيل لمدة شهرين")).toBeInTheDocument();

			// Toggle back to English
			act(() => {
				useAppStore.getState().setLanguage("en");
			});

			expect(screen.getByText("Notifications")).toBeInTheDocument();
			expect(screen.getByText("Reminder Due")).toBeInTheDocument();
			expect(screen.getByText("Release Follow-up Due")).toBeInTheDocument();
		});

		it("scopes translated text with lang=ar and dir=rtl without mirroring dropdown layout", async () => {
			const user = userEvent.setup();
			useAppStore.getState().setLanguage("ar");
			useAppStore.setState({
				notifications: [reminderNotif],
			});

			const { container } = renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("الإشعارات"));

			// Parent dropdown container stays LTR (no dir=rtl on layout containers)
			const popover = container.querySelector(".shadow-2xl");
			expect(popover?.getAttribute("dir")).not.toBe("rtl");

			// Leaf text has lang=ar and dir=rtl
			const arabicTitle = screen.getByText("تذكير مستحق");
			expect(arabicTitle.closest('[lang="ar"]')).not.toBeNull();
			expect(arabicTitle.closest('[dir="rtl"]')).not.toBeNull();
		});

		it("falls back to plain title and description if keys are absent (legacy data)", async () => {
			const user = userEvent.setup();
			useAppStore.getState().setLanguage("ar");
			useAppStore.setState({
				notifications: [
					createTestNotification({
						id: "legacy-1",
						type: "reminder",
						title: "Legacy Title",
						description: "Legacy Description",
					}),
				],
			});

			renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("الإشعارات"));

			expect(screen.getByText("Legacy Title")).toBeInTheDocument();
			expect(screen.getByText("Legacy Description")).toBeInTheDocument();
		});

		it("keeps toasts fired from the dropdown in English even in AR mode", async () => {
			const { toast } = await import("sonner");
			const user = userEvent.setup();
			useAppStore.getState().setLanguage("ar");
			useAppStore.setState({
				notifications: [reminderNotif],
				getWorkingRows: () => [],
			});

			renderWithProviders(<NotificationsDropdown />);
			await user.click(screen.getByTitle("الإشعارات"));

			// Click the notification item
			await user.click(screen.getByText("تذكير مستحق"));

			// Toast error must stay in English
			expect(toast.error).toHaveBeenCalledWith("Order no longer available");
		});
	});
});
