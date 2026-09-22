import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrderSubmit } from "@/components/orders/form/hooks/useOrderForm/useOrderSubmit";
import { IdentityFields } from "@/components/orders/form/IdentityFields";
import type { FormData } from "@/components/orders/form/types";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { useDraftSession } from "@/hooks/useDraftSession";
import { resolveValidationMessageKey } from "@/locales";
import { OrderFormSchema } from "@/schemas/form.schema";
import { useAppStore } from "@/store/useStore";

/**
 * #268 acceptance criteria, end to end: "with a visible validation error and
 * a pending async action, switch locale and assert translated copy with
 * unchanged validation outcomes." The two `describe` blocks below cover each
 * half of that scenario against real production code (`IdentityFields`,
 * `useOrderValidation`'s mapping via `resolveValidationMessageKey`, and the
 * real `useDraftSession` hook + real Zustand store) — only network-bound
 * mutations and the toast library are mocked.
 */

vi.mock("@/services/appSettingsService", () => ({
	appSettingsService: {
		fetchAppSettings: vi.fn().mockResolvedValue({
			models: [],
			repairSystems: [],
			requesters: [],
		}),
		updateAppSettings: vi.fn(),
	},
}));

const toastMocks = vi.hoisted(() => ({
	error: vi.fn(),
	success: vi.fn(),
	dismiss: vi.fn(),
	custom: vi.fn(),
	plain: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: Object.assign(toastMocks.plain, {
		error: toastMocks.error,
		success: toastMocks.success,
		dismiss: toastMocks.dismiss,
		custom: toastMocks.custom,
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

function renderWithProviders(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<LocaleProvider>{children}</LocaleProvider>
		</QueryClientProvider>,
	);
}

function switchLocale(locale: "en" | "ar") {
	act(() => {
		useAppStore.setState({ locale });
	});
}

beforeEach(() => {
	localStorage.clear();
	toastMocks.error.mockClear();
	toastMocks.success.mockClear();
	toastMocks.dismiss.mockClear();
	toastMocks.custom.mockClear();
	toastMocks.plain.mockClear();
	useAppStore.setState({ locale: "en", lastSaveResult: null });
	useAppStore.setState((state) => ({
		draftSession: {
			...state.draftSession,
			dirty: false,
			saving: false,
			saveError: null,
			saveCheckpoint: null,
		},
	}));
});

describe("visible form validation messages re-render translated on locale switch", () => {
	const EMPTY_FORM: FormData = {
		customerName: "",
		vin: "",
		mobile: "",
		cntrRdg: "",
		model: "",
		repairSystem: "",
		startWarranty: "",
		requester: "",
		sabNumber: "",
		acceptedBy: "",
		company: "",
		rDate: "",
	};

	it("translates an already-visible field error when the locale changes, without re-running validation or mutating form state", async () => {
		// Real schema, real mapping — exactly what `useOrderValidation.validateForm`
		// does. Computed once, then never recomputed for the rest of this test.
		const result = OrderFormSchema.safeParse(EMPTY_FORM);
		expect(result.success).toBe(false);
		const errors = result.success
			? {}
			: {
					customerName: resolveValidationMessageKey(
						result.error.flatten().fieldErrors.customerName?.[0],
					),
				};
		expect(errors.customerName).toBe("validation.customerNameRequired");
		const errorsSnapshot = { ...errors };

		renderWithProviders(
			<IdentityFields
				formData={EMPTY_FORM}
				onFieldChange={() => {}}
				errors={errors}
				getFieldError={(field) => field === "customerName"}
				isEditMode={false}
			/>,
		);

		expect(
			await screen.findByText("Customer name is required"),
		).toBeInTheDocument();

		switchLocale("ar");

		// Same underlying validation outcome (identical `errors` object/keys —
		// never touched by the switch), but re-rendered in the new language.
		expect(errors).toEqual(errorsSnapshot);
		expect(await screen.findByText("اسم العميل مطلوب")).toBeInTheDocument();
		expect(
			screen.queryByText("Customer name is required"),
		).not.toBeInTheDocument();
	});
});

describe("an async action completing after a locale switch reports in the active language", () => {
	function DraftStuckToastDriver() {
		useDraftSession("orders");
		return null;
	}

	it("shows the translated toast once the switch has already happened, with no duplicate toast and no reset timer", async () => {
		renderWithProviders(<DraftStuckToastDriver />);

		// Operator switches language while the save is still pending (nothing
		// has completed yet — no toast fired for the switch itself).
		switchLocale("ar");
		expect(toastMocks.error).not.toHaveBeenCalled();

		// The async save now completes (stuck retrying one failing command) —
		// after the switch, so it must report in Arabic, not English.
		act(() => {
			useAppStore.setState((state) => ({
				draftSession: {
					...state.draftSession,
					saveError: "Network timeout",
					saveCheckpoint: { nextIndex: 1, idMapEntries: [] },
				},
			}));
		});

		await waitFor(() => {
			expect(toastMocks.error).toHaveBeenCalledTimes(1);
		});
		expect(toastMocks.error).toHaveBeenCalledWith(
			"فشل الحفظ: Network timeout",
			expect.objectContaining({
				id: "draft-save-stuck",
				duration: Number.POSITIVE_INFINITY,
				action: expect.objectContaining({ label: "تخطي هذا التغيير" }),
			}),
		);

		// Switching language again while the same stuck-save toast is still up
		// must update it in place (same `id`), not add a second toast, and must
		// not touch its (already infinite) duration.
		switchLocale("en");

		await waitFor(() => {
			expect(toastMocks.error).toHaveBeenLastCalledWith(
				"Save failed: Network timeout",
				expect.objectContaining({
					id: "draft-save-stuck",
					duration: Number.POSITIVE_INFINITY,
					action: expect.objectContaining({ label: "Skip this change" }),
				}),
			);
		});
		expect(toastMocks.error).toHaveBeenCalledTimes(2);
		for (const call of toastMocks.error.mock.calls) {
			expect(call[1]).toMatchObject({
				id: "draft-save-stuck",
				duration: Number.POSITIVE_INFINITY,
			});
		}
	});

	it("reports a one-shot save result toast in the language active when it fires, and never re-fires it on a later switch", async () => {
		renderWithProviders(<DraftStuckToastDriver />);

		switchLocale("ar");

		act(() => {
			useAppStore.setState({ lastSaveResult: "error" });
		});

		await waitFor(() => {
			expect(toastMocks.error).toHaveBeenCalledWith(
				"فشل حفظ المسودة. يرجى المحاولة مرة أخرى.",
			);
		});
		expect(toastMocks.error).toHaveBeenCalledTimes(1);

		// `lastSaveResult` is cleared by the hook right after showing the toast
		// (see useDraftSession.tsx), so a later locale switch must not resurface
		// or duplicate it.
		switchLocale("en");
		await Promise.resolve();
		expect(toastMocks.error).toHaveBeenCalledTimes(1);
	});

	it("uses the current locale when a pending duplicate check fails", async () => {
		let rejectCheck: ((reason?: unknown) => void) | undefined;
		const pendingDuplicateCheck = new Promise<never>((_, reject) => {
			rejectCheck = reject;
		});
		const checkHistoricalDuplicate = vi.fn(() => pendingDuplicateCheck);
		const wrapper = ({ children }: { children: ReactNode }) => (
			<LocaleProvider>{children}</LocaleProvider>
		);

		const { result } = renderHook(
			() =>
				useOrderSubmit({
					formData: {
						customerName: "Mahmoud",
						vin: "VF1BB0A0F12345678",
						mobile: "01000000000",
						cntrRdg: "",
						model: "",
						repairSystem: "",
						startWarranty: "",
						requester: "",
						sabNumber: "",
						acceptedBy: "",
						company: "",
						rDate: "",
					},
					parts: [
						{
							id: "part-1",
							partNumber: "12345",
							description: "Part",
							quantity: 1,
						},
					],
					validationMode: "easy",
					isEditMode: false,
					selectedRows: [],
					hasValidationErrors: false,
					partValidationWarnings: {},
					checkHistoricalDuplicate,
					setValidationMode: vi.fn(),
					setBeastModeTimer: vi.fn(),
					setBeastModeErrors: vi.fn(),
					setIsCheckingDuplicates: vi.fn(),
					setDuplicateWarning: vi.fn(),
					onSubmit: vi.fn(),
				}),
			{ wrapper },
		);

		let submitPromise: Promise<void> | undefined;
		act(() => {
			submitPromise = result.current.handleLocalSubmit();
		});
		await waitFor(() => expect(checkHistoricalDuplicate).toHaveBeenCalled());

		switchLocale("ar");
		await act(async () => {
			rejectCheck?.(new Error("Network failed"));
			await submitPromise;
		});

		expect(toastMocks.error).toHaveBeenCalledWith(
			"تعذر التحقق من القطع المكررة. يرجى المحاولة مرة أخرى.",
		);
	});

	it("updates recovery copy and actions when the locale changes", async () => {
		const workspaceId = useAppStore.getState().draftSession.workspaceId;
		localStorage.setItem(
			"pending-sys-draft-v1",
			JSON.stringify({
				workspaceId,
				updatedAt: Date.now(),
				pendingCommands: [
					{
						type: "patchRow",
						id: "row-1",
						sourceStage: "orders",
						destinationStage: "orders",
						updates: {},
						previousValues: {},
					},
				],
			}),
		);
		let renderer: ((toastId: string | number) => ReactNode) | undefined;
		toastMocks.custom.mockImplementation((renderToast) => {
			renderer = renderToast;
			return "recovery-toast";
		});

		renderWithProviders(<DraftStuckToastDriver />);
		await waitFor(() => expect(renderer).toBeDefined());
		const englishToast = render(renderer?.("recovery-toast") as ReactNode);
		expect(englishToast.getByText("Restore")).toBeInTheDocument();
		expect(englishToast.getByText("Discard")).toBeInTheDocument();
		englishToast.unmount();

		switchLocale("ar");
		await waitFor(() => expect(toastMocks.custom).toHaveBeenCalledTimes(2));
		const arabicToast = render(renderer?.("recovery-toast") as ReactNode);
		expect(arabicToast.getByText("استعادة")).toBeInTheDocument();
		expect(arabicToast.getByText("تجاهل")).toBeInTheDocument();
	});
});
