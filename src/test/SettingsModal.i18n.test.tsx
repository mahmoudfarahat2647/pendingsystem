import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

const reportSettings = vi.hoisted(() => ({
	current: {
		is_enabled: true,
		frequency: "Weekly-1",
		emails: ["ops@example.com"],
		last_sent_at: null as string | null,
	},
}));

const mainRows = vi.hoisted(() => ({ current: [] as PendingRow[] }));

vi.mock("@/hooks/queries/useOrdersQuery", () => ({
	useOrdersQuery: (stage: string) => ({
		data: stage === "main" ? mainRows.current : [],
	}),
}));

vi.mock("@/hooks/queries/reports/useReportSettingsQuery", () => ({
	useReportSettingsQuery: () => ({ data: reportSettings.current }),
	useUpdateReportSettingsMutation: () => ({ mutate: vi.fn() }),
	useAddEmailRecipientMutation: () => ({ mutate: vi.fn() }),
	useRemoveEmailRecipientMutation: () => ({ mutate: vi.fn() }),
	useTriggerManualBackupMutation: () => ({
		mutateAsync: vi.fn(),
		isPending: false,
	}),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

const renderModal = () =>
	render(<SettingsModal open={true} onOpenChange={() => {}} />);

const openTab = async (
	user: ReturnType<typeof userEvent.setup>,
	name: string,
) => {
	await user.click(screen.getByRole("button", { name }));
};

describe("SettingsModal i18n (Wave 4)", () => {
	beforeEach(() => {
		useAppStore.getState().setLanguage("en");
		useAppStore.getState().setIsLocked(true);
		mainRows.current = [];
		reportSettings.current = {
			is_enabled: true,
			frequency: "Weekly-1",
			emails: ["ops@example.com"],
			last_sent_at: null,
		};
		vi.mocked(toast.error).mockClear();
	});

	afterEach(() => {
		useAppStore.getState().setLanguage("en");
		useAppStore.getState().setIsLocked(true);
	});

	it("renders English shell strings by default", () => {
		renderModal();

		expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
		for (const tab of [
			"Statuses",
			"Theme Color",
			"Backup & Reports",
			"Permission",
		]) {
			expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
		}
		expect(screen.getByText("Locked")).toBeInTheDocument();
		expect(screen.getByText("Version")).toBeInTheDocument();
		expect(screen.getByText("Status Management")).toBeInTheDocument();
		expect(screen.getByText("Add New Status")).toBeInTheDocument();
		expect(screen.getByText("Managed Statuses")).toBeInTheDocument();
	});

	it("renders the locked Arabic shell and keeps the tab order and layout", () => {
		useAppStore.getState().setLanguage("ar");
		renderModal();

		const dialog = screen.getByRole("dialog", { name: "الإعدادات" });
		const tabs = [
			"الحالات",
			"لون المظهر",
			"النسخ الاحتياطي والتقارير",
			"الصلاحيات",
		];
		const nav = dialog.querySelector("nav");
		expect(nav).not.toBeNull();
		const navButtons = within(nav as HTMLElement).getAllByRole("button");
		expect(navButtons.map((b) => b.textContent)).toEqual(tabs);

		// Layout containers never become RTL — only leaf text scopes do.
		expect(nav).not.toHaveAttribute("dir");
		expect(dialog).not.toHaveAttribute("dir");
		expect(dialog.querySelectorAll('[dir="rtl"]').length).toBeGreaterThan(0);
		for (const el of dialog.querySelectorAll('[dir="rtl"]')) {
			expect(el.tagName).toBe("SPAN");
		}

		expect(screen.getByText("مقفل")).toBeInTheDocument();
		expect(screen.getByText("الإصدار")).toBeInTheDocument();
		expect(screen.getByText("إدارة الحالات")).toBeInTheDocument();
		expect(
			screen.getByText("خصّص أسماء الحالات وألوانها المستخدمة في الجدول."),
		).toBeInTheDocument();
		expect(screen.getByText("إضافة حالة جديدة")).toBeInTheDocument();
		expect(screen.getByText("الحالات المُدارة")).toBeInTheDocument();
		expect(screen.getByText("التعديل مقفل")).toBeInTheDocument();
		expect(screen.getByText("إضافة حالة")).toBeInTheDocument();
		expect(screen.getByText("لون الحالة")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("أدخل اسم الحالة، مثال: In Transit"),
		).toBeInTheDocument();
	});

	it("translates the password prompt, including the incorrect-password state", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		renderModal();

		await user.click(screen.getByRole("button", { name: "مقفل" }));
		const input = screen.getByPlaceholderText("كلمة المرور");
		expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "فتح القفل" }),
		).toBeInTheDocument();

		await user.type(input, "wrong-password{Enter}");
		expect(
			screen.getByPlaceholderText("كلمة مرور غير صحيحة"),
		).toBeInTheDocument();
	});

	it("renders the unlocked Arabic state", () => {
		useAppStore.getState().setLanguage("ar");
		useAppStore.getState().setIsLocked(false);
		renderModal();

		expect(screen.getByText("مفتوح")).toBeInTheDocument();
		expect(screen.queryByText("التعديل مقفل")).not.toBeInTheDocument();
	});

	it("localizes the dialog close button label in EN and AR", () => {
		const { unmount } = renderModal();
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
		unmount();

		useAppStore.getState().setLanguage("ar");
		renderModal();
		expect(screen.getByRole("button", { name: "إغلاق" })).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Close" }),
		).not.toBeInTheDocument();
	});

	it("translates the color picker heading and keeps the hex value", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		useAppStore.getState().setIsLocked(false);
		renderModal();

		await user.click(screen.getByRole("button", { name: "10b981" }));
		expect(screen.getByText("اختر اللون")).toBeInTheDocument();
		expect(screen.queryByText("Select Color")).not.toBeInTheDocument();
		expect(screen.getAllByDisplayValue("#10b981").length).toBeGreaterThan(0);
	});

	it("translates status usage counts and keeps user status names in English", () => {
		useAppStore.getState().setLanguage("ar");
		const label = useAppStore.getState().partStatuses[0]?.label ?? "";
		mainRows.current = [
			{ id: "r1", status: label },
			{ id: "r2", status: label },
		] as PendingRow[];
		renderModal();

		expect(screen.getByText(label)).toBeInTheDocument();
		expect(screen.getByText("2 استخدام")).toBeInTheDocument();
	});

	it("translates the Theme Color tab", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		renderModal();

		await openTab(user, "لون المظهر");
		expect(screen.getByText("مظهر النظام")).toBeInTheDocument();
		expect(screen.getByText("إعدادات المظهر")).toBeInTheDocument();
		expect(
			screen.getByText("السمات المخصصة وإعدادات الألوان الجاهزة قادمة قريبًا."),
		).toBeInTheDocument();
	});

	it("translates the Permission tab in locked and unlocked states", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		const { unmount } = renderModal();

		await openTab(user, "الصلاحيات");
		expect(screen.getByText("صلاحية تعديل الجدول")).toBeInTheDocument();
		expect(screen.getByText("السماح بتعديل الجدول")).toBeInTheDocument();
		expect(
			screen.getByRole("switch", { name: "السماح بتعديل الجدول" }),
		).toBeDisabled();
		expect(
			screen.getByText("افتح قفل الإعدادات لتغيير هذه الصلاحية."),
		).toBeInTheDocument();
		unmount();

		useAppStore.getState().setIsLocked(false);
		renderModal();
		await openTab(user, "الصلاحيات");
		expect(
			screen.queryByText("افتح قفل الإعدادات لتغيير هذه الصلاحية."),
		).not.toBeInTheDocument();
	});

	it("translates the Backup & Reports tab but keeps emails and schedule values", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		useAppStore.getState().setIsLocked(false);
		renderModal();

		await openTab(user, "النسخ الاحتياطي والتقارير");
		for (const text of [
			"إعدادات النسخ الاحتياطي والتقارير",
			"الجدولة",
			"النسخ الاحتياطي التلقائي",
			"المستلمون",
			"إجراء يدوي",
			"لم يتم إرسال أي تقارير بعد.",
			"إرسال النسخة الاحتياطية الآن",
		]) {
			expect(screen.getByText(text)).toBeInTheDocument();
		}
		expect(screen.getAllByText("التكرار").length).toBeGreaterThan(0);
		expect(
			screen.getByPlaceholderText("البريد الإلكتروني"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "إضافة مستلم" }),
		).toBeInTheDocument();

		// User data and schedule values stay as-is.
		expect(screen.getByText("ops@example.com")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "إزالة ops@example.com" }),
		).toBeInTheDocument();
		expect(screen.getByText("Weekly, Mon")).toBeInTheDocument();
	});

	it("keeps toasts from Settings actions in English while AR is active", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		useAppStore.getState().setIsLocked(false);
		renderModal();

		await openTab(user, "النسخ الاحتياطي والتقارير");
		await user.type(
			screen.getByPlaceholderText("البريد الإلكتروني"),
			"not-an-email{Enter}",
		);
		expect(toast.error).toHaveBeenCalledWith(
			"Please enter a valid email address",
		);
	});

	it("shows the no-recipients message in Arabic", async () => {
		const user = userEvent.setup();
		reportSettings.current = { ...reportSettings.current, emails: [] };
		useAppStore.getState().setLanguage("ar");
		renderModal();

		await openTab(user, "النسخ الاحتياطي والتقارير");
		expect(screen.getByText("لم تتم إضافة مستلمين بعد.")).toBeInTheDocument();
	});
});
