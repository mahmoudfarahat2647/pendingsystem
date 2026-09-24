import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnfreezeMoveDialog } from "@/components/freeze/UnfreezeMoveDialog";
import { DuplicateOrderWarningModal } from "@/components/orders/DuplicateOrderWarningModal";
import { ArchiveReasonModal } from "@/components/shared/ArchiveReasonModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditAttachmentModal } from "@/components/shared/EditAttachmentModal";
import { EditNoteModal } from "@/components/shared/EditNoteModal";
import { EditReminderModal } from "@/components/shared/EditReminderModal";
import { FreezeReasonModal } from "@/components/shared/FreezeReasonModal";
import { ReleaseConfirmationModal } from "@/components/shared/ReleaseConfirmationModal";
import { ReorderReasonDialog } from "@/components/shared/ReorderReasonDialog";
import { useAppStore } from "@/store/useStore";

vi.mock("@/hooks/queries/useQuickTemplatesQuery", () => ({
	useQuickTemplatesQuery: () => ({
		data: [{ id: "tpl-1", text: "Waiting for supplier" }],
	}),
	useAddQuickTemplateMutation: () => ({ mutate: vi.fn() }),
	useRemoveQuickTemplateMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/lib/attachment-browser", () => ({
	deleteFromStorage: vi.fn(),
	getPublicUrl: () => "https://example.test/file.pdf",
	uploadToStorage: vi.fn(),
}));

describe("action modals i18n (Wave 5)", () => {
	beforeEach(() => {
		useAppStore.getState().setLanguage("ar");
	});

	afterEach(() => {
		useAppStore.getState().setLanguage("en");
	});

	describe("ConfirmDialog", () => {
		it("renders Arabic default buttons and type-to-confirm instructions", () => {
			render(
				<ConfirmDialog
					open
					onOpenChange={vi.fn()}
					onConfirm={vi.fn()}
					title="حذف السجلات"
					description="هل أنت متأكد؟"
					requireTypeToConfirm="yes"
				/>,
			);

			expect(screen.getByText("حذف السجلات")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "تأكيد" })).toBeInTheDocument();
			expect(screen.getByText(/اكتب/)).toHaveAttribute("lang", "ar");
			expect(screen.getByTitle("اكتب yes للتأكيد")).toBeInTheDocument();
		});

		it("keeps the English type-to-confirm word and its matching logic", async () => {
			const user = userEvent.setup();
			const onConfirm = vi.fn();
			render(
				<ConfirmDialog
					open
					onOpenChange={vi.fn()}
					onConfirm={onConfirm}
					title="t"
					description="d"
					requireTypeToConfirm="yes"
				/>,
			);

			const confirm = screen.getByRole("button", { name: "تأكيد" });
			const input = screen.getByPlaceholderText("yes");
			await user.type(input, "نعم");
			expect(confirm).toBeDisabled();

			await user.clear(input);
			await user.type(input, "yes");
			expect(confirm).toBeEnabled();
			await user.click(confirm);
			expect(onConfirm).toHaveBeenCalledTimes(1);
		});
	});

	describe("FreezeReasonModal", () => {
		it("renders Arabic copy while keeping the reason required", async () => {
			const user = userEvent.setup();
			const onSave = vi.fn();
			render(<FreezeReasonModal open onOpenChange={vi.fn()} onSave={onSave} />);

			expect(screen.getByText("تجميد السجل")).toBeInTheDocument();
			expect(screen.getByText("سبب التجميد")).toBeInTheDocument();
			expect(screen.getByText("قوالب سريعة")).toBeInTheDocument();
			// Quick-template text is user content and stays as typed.
			expect(screen.getByText("Waiting for supplier")).toBeInTheDocument();

			const confirm = screen.getByRole("button", { name: "تأكيد التجميد" });
			expect(confirm).toBeDisabled();

			await user.type(
				screen.getByPlaceholderText("يرجى إدخال سبب تجميد هذا السجل..."),
				"Customer abroad",
			);
			expect(confirm).toBeEnabled();
			await user.click(confirm);
			expect(onSave).toHaveBeenCalledWith("Customer abroad");
		});
	});

	describe("ReleaseConfirmationModal", () => {
		it("translates instructions but still requires the word release", async () => {
			const user = userEvent.setup();
			const onConfirm = vi.fn();
			render(
				<ReleaseConfirmationModal
					open
					vin="VF1RFA00000000001"
					formattedMileage="4,999"
					onCancel={vi.fn()}
					onConfirm={onConfirm}
				/>,
			);

			expect(screen.getByText("الإفراج مطلوب")).toBeInTheDocument();
			expect(screen.getByText("4,999 كم")).toBeInTheDocument();
			expect(screen.getByText("VF1RFA00000000001")).toBeInTheDocument();

			const confirm = screen.getByRole("button", {
				name: "إفراج إلى Call List",
			});
			const input = screen.getByLabelText("أدخل كلمة التأكيد");
			expect(input).toHaveAttribute("placeholder", "release");

			await user.type(input, "إفراج");
			expect(confirm).toBeDisabled();

			await user.clear(input);
			await user.type(input, "release");
			expect(confirm).toBeEnabled();
			await user.click(confirm);
			expect(onConfirm).toHaveBeenCalledTimes(1);
		});
	});

	describe("other action modals", () => {
		it("ArchiveReasonModal renders Arabic copy", () => {
			render(
				<ArchiveReasonModal open onOpenChange={vi.fn()} onSave={vi.fn()} />,
			);
			expect(screen.getByText("أرشفة السجل")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "تأكيد الأرشفة" }),
			).toBeDisabled();
		});

		it("ReorderReasonDialog renders Arabic copy", () => {
			render(
				<ReorderReasonDialog
					open
					onOpenChange={vi.fn()}
					reason=""
					onReasonChange={vi.fn()}
					onCancel={vi.fn()}
					onConfirm={vi.fn()}
					placeholder="placeholder"
				/>,
			);
			expect(screen.getByText("إعادة الطلب - السبب مطلوب")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "تأكيد إعادة الطلب" }),
			).toBeDisabled();
		});

		it("UnfreezeMoveDialog keeps stage names English", () => {
			render(
				<UnfreezeMoveDialog
					open
					onOpenChange={vi.fn()}
					initialStage="main"
					rowCount={3}
					origin={{ kind: "single", stage: "main" }}
					onCancel={vi.fn()}
					onConfirm={vi.fn()}
				/>,
			);
			expect(screen.getByText("نقل 3 صفوف")).toBeInTheDocument();
			expect(screen.getByText("قادم من Main Sheet")).toBeInTheDocument();
			expect(screen.getByText("Freeze")).toBeInTheDocument();
			expect(
				screen.getByRole("combobox", { name: "المرحلة الوجهة" }),
			).toBeInTheDocument();
		});

		it("DuplicateOrderWarningModal renders Arabic copy around user data", () => {
			render(
				<DuplicateOrderWarningModal
					open
					onClose={vi.fn()}
					location="main"
					vin="VIN123"
					partNumber="PN-9"
				/>,
			);
			expect(screen.getByText("تم اكتشاف طلب مكرر")).toBeInTheDocument();
			expect(screen.getByText("VIN123")).toBeInTheDocument();
			expect(screen.getByText("PN-9")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "تم" })).toBeInTheDocument();
		});

		it("EditNoteModal renders Arabic copy", () => {
			render(
				<EditNoteModal
					open
					onOpenChange={vi.fn()}
					initialContent=""
					onSave={vi.fn()}
					stage="orders"
					sourceTag="orders"
				/>,
			);
			expect(screen.getByText("الملاحظات")).toBeInTheDocument();
			expect(screen.getByText("وسم تلقائي بـ #orders")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "حفظ الملاحظات" }),
			).toBeInTheDocument();
		});

		it("EditReminderModal renders Arabic copy", () => {
			render(
				<EditReminderModal
					open
					onOpenChange={vi.fn()}
					initialData={null}
					onSave={vi.fn()}
				/>,
			);
			expect(screen.getByText("تعيين تذكير")).toBeInTheDocument();
			expect(
				screen.getByPlaceholderText("ما الذي يجب إنجازه؟"),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "حفظ التذكير" }),
			).toBeInTheDocument();
		});

		it("EditAttachmentModal renders Arabic copy and keeps file names", () => {
			render(
				<EditAttachmentModal
					open
					onOpenChange={vi.fn()}
					onSave={vi.fn()}
					orderId="order-1"
					initialFilePaths={["order-1/invoice.pdf"]}
				/>,
			);
			expect(screen.getByText("المرفقات")).toBeInTheDocument();
			expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
			expect(screen.getByTitle("فتح الملف")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "حفظ التغييرات" }),
			).toBeInTheDocument();
		});
	});

	describe("dialog close control", () => {
		it.each([
			[
				"ReleaseConfirmationModal",
				() => (
					<ReleaseConfirmationModal
						open
						vin="VIN1"
						formattedMileage="100"
						onCancel={vi.fn()}
						onConfirm={vi.fn()}
					/>
				),
			],
			[
				"FreezeReasonModal",
				() => (
					<FreezeReasonModal open onOpenChange={vi.fn()} onSave={vi.fn()} />
				),
			],
			[
				"ArchiveReasonModal",
				() => (
					<ArchiveReasonModal open onOpenChange={vi.fn()} onSave={vi.fn()} />
				),
			],
			[
				"EditReminderModal",
				() => (
					<EditReminderModal
						open
						onOpenChange={vi.fn()}
						initialData={null}
						onSave={vi.fn()}
					/>
				),
			],
			[
				"UnfreezeMoveDialog",
				() => (
					<UnfreezeMoveDialog
						open
						onOpenChange={vi.fn()}
						initialStage="main"
						rowCount={1}
						origin={{ kind: "none" }}
						onCancel={vi.fn()}
						onConfirm={vi.fn()}
					/>
				),
			],
		])("%s announces an Arabic close label", (_name, renderModal) => {
			render(renderModal());
			expect(screen.getByRole("button", { name: "إغلاق" })).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "Close" }),
			).not.toBeInTheDocument();
		});
	});

	describe("reminder date picker", () => {
		it("shows an Arabic date, calendar and AM/PM with Western digits", async () => {
			const user = userEvent.setup();
			render(
				<EditReminderModal
					open
					onOpenChange={vi.fn()}
					initialData={{ date: "2026-09-24", time: "14:30", subject: "Call" }}
					onSave={vi.fn()}
				/>,
			);

			const trigger = screen.getByRole("button", { name: "24 سبتمبر 2026" });
			expect(screen.getByText("م")).toBeInTheDocument();

			await user.click(trigger);
			const grid = await screen.findByRole("grid");
			expect(grid).toHaveAttribute("aria-label", "سبتمبر 2026");
			expect(
				screen.getByRole("button", { name: "اذهب إلى الشهر التالي" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "اذهب إلى الشهر السابق" }),
			).toBeInTheDocument();
			// Layout stays LTR — the calendar never gets a dir attribute.
			expect(grid.closest("[dir='rtl'].rdp-root")).toBeNull();
		});

		it("keeps the English date picker in EN mode", async () => {
			useAppStore.getState().setLanguage("en");
			const user = userEvent.setup();
			render(
				<EditReminderModal
					open
					onOpenChange={vi.fn()}
					initialData={{ date: "2026-09-24", time: "14:30", subject: "Call" }}
					onSave={vi.fn()}
				/>,
			);

			await user.click(
				screen.getByRole("button", { name: "September 24th, 2026" }),
			);
			expect(await screen.findByRole("grid")).toHaveAttribute(
				"aria-label",
				"September 2026",
			);
			expect(screen.getByText("PM")).toBeInTheDocument();
		});
	});
});
