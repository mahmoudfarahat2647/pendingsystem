import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shared/Sidebar";
import { SidebarUserMenu } from "@/components/shared/SidebarUserMenu";
import { useAppStore } from "@/store/useStore";

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

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
		...props
	}: ComponentProps<"a"> & { href: string }) => (
		<a
			{...props}
			href={href}
			onClick={(event) => {
				onClick?.(event);
				if (!event.defaultPrevented) {
					navigationMocks.push(href);
				}
			}}
		>
			{children}
		</a>
	),
}));

vi.mock("@/components/shared/SettingsModal", () => ({
	SettingsModal: () => null,
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

describe("Sidebar i18n (Wave 2)", () => {
	beforeEach(() => {
		navigationMocks.pathname = "/orders";
		navigationMocks.push.mockReset();
		useAppStore.getState().setLanguage("en");
		useAppStore.getState().clearCurrentEditVin();
	});

	afterEach(() => {
		useAppStore.getState().setLanguage("en");
		useAppStore.getState().clearCurrentEditVin();
	});

	it("renders English sidebar strings by default", () => {
		renderWithProviders(<Sidebar />);

		expect(
			screen.getByRole("navigation", { name: "Main navigation" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("link", { name: "Go to Dashboard" }).length,
		).toBeGreaterThan(0);
		expect(screen.getByLabelText("Sign out menu")).toBeInTheDocument();
		expect(screen.getByText("User")).toBeInTheDocument();
		expect(screen.getByText("System Creator")).toBeInTheDocument();
		// Nav labels stay English in both languages.
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Orders")).toBeInTheDocument();
	});

	it("renders Arabic sidebar strings when language is ar, nav labels stay English", () => {
		useAppStore.getState().setLanguage("ar");
		renderWithProviders(<Sidebar />);

		expect(
			screen.getByRole("navigation", { name: "التنقل الرئيسي" }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("link", { name: "الانتقال إلى لوحة التحكم" }).length,
		).toBeGreaterThan(0);
		expect(screen.getByLabelText("قائمة تسجيل الخروج")).toBeInTheDocument();
		expect(screen.getByText("مستخدم")).toBeInTheDocument();
		expect(screen.getByText("منشئ النظام")).toBeInTheDocument();

		// Stage names stay English by decision.
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Orders")).toBeInTheDocument();
		expect(screen.getByText("Main Sheet")).toBeInTheDocument();
		expect(screen.getByText("Call")).toBeInTheDocument();
		expect(screen.getByText("Booking")).toBeInTheDocument();
		expect(screen.getByText("Archive")).toBeInTheDocument();
		expect(screen.getByText("Freeze")).toBeInTheDocument();
		expect(screen.getByText("Reports")).toBeInTheDocument();
	});

	it("scopes translated leaf text with lang/dir without mirroring layout", () => {
		useAppStore.getState().setLanguage("ar");
		const { container } = renderWithProviders(<Sidebar />);

		const aside = container.querySelector("aside");
		expect(aside).toBeInTheDocument();
		// Layout containers stay LTR: no dir=rtl on aside/nav.
		expect(aside?.getAttribute("dir")).not.toBe("rtl");
		expect(container.querySelector("nav")?.getAttribute("dir")).not.toBe("rtl");

		// Translated leaf blocks carry lang=ar dir=rtl.
		const userFallback = screen.getByText("مستخدم");
		expect(userFallback.closest('[lang="ar"]')).not.toBeNull();
		expect(userFallback.closest('[dir="rtl"]')).not.toBeNull();
	});

	it("shows the Arabic Unsaved Changes dialog with translated actions", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		// Simulate an active edit on a VIN that is not in the target tab,
		// so clicking another nav entry opens the guard dialog.
		useAppStore.getState().setCurrentEditVin("VIN123AR", "test-edit-id");

		renderWithProviders(<Sidebar />);

		const bookingLink = screen.getByRole("link", { name: "Booking" });
		await user.click(bookingLink);

		expect(screen.getByText("تغييرات غير محفوظة")).toBeInTheDocument();
		expect(screen.getByText("VIN123AR")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /إلغاء/ })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /تجاهل والمتابعة/ }),
		).toBeInTheDocument();
	});

	it("translates the sign-out menu item in AR", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");

		renderWithProviders(
			<SidebarUserMenu
				trigger={
					<button type="button" aria-label="trigger">
						open
					</button>
				}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "trigger" }));
		expect(
			await screen.findByRole("menuitem", { name: /تسجيل الخروج/ }),
		).toBeInTheDocument();
	});

	it("keeps the sign-out menu item English by default", async () => {
		const user = userEvent.setup();

		renderWithProviders(
			<SidebarUserMenu
				trigger={
					<button type="button" aria-label="trigger">
						open
					</button>
				}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "trigger" }));
		const item = await screen.findByRole("menuitem", { name: /Sign out/ });
		expect(within(item).getByText("Sign out")).toBeInTheDocument();
	});

	it("keeps collapsed tooltips English and the collapse affordance in AR", async () => {
		const user = userEvent.setup();
		useAppStore.getState().setLanguage("ar");
		const { container } = renderWithProviders(<Sidebar />);

		// The collapse toggle is the only direct button child of the aside;
		// the sign-out trigger lives inside the user block.
		const collapseButton = container.querySelector("aside > button");
		expect(collapseButton).not.toBeNull();
		await user.click(collapseButton as HTMLElement);

		// Collapsed width, logo aria-label still Arabic, user block hidden.
		expect(container.querySelector("aside")?.className).toContain("w-20");
		expect(
			screen.getAllByRole("link", { name: "الانتقال إلى لوحة التحكم" }).length,
		).toBeGreaterThan(0);
		expect(screen.queryByText("مستخدم")).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText("قائمة تسجيل الخروج"),
		).not.toBeInTheDocument();

		// Collapsed title tooltips stay English stage names by decision.
		for (const label of ["Dashboard", "Orders", "Main Sheet"]) {
			const link = screen.getByRole("link", { name: label });
			expect(link.getAttribute("title")).toBe(label);
		}
	});

	it("keeps icons, collapse button and sidebar position identical in EN and AR", () => {
		const countIcons = () => document.querySelectorAll("aside svg").length;
		const countCollapseButtons = () =>
			document.querySelectorAll("aside > button").length;

		const enRender = renderWithProviders(<Sidebar />);
		const enIcons = countIcons();
		expect(enIcons).toBeGreaterThan(0);
		expect(countCollapseButtons()).toBe(1);
		expect(enRender.container.querySelector("aside")?.className).toContain(
			"border-r",
		);
		enRender.unmount();

		useAppStore.getState().setLanguage("ar");
		const arRender = renderWithProviders(<Sidebar />);
		expect(countIcons()).toBe(enIcons);
		expect(countCollapseButtons()).toBe(1);
		expect(arRender.container.querySelector("aside")?.className).toContain(
			"border-r",
		);
		arRender.unmount();
	});

	it("keeps truncation on the AR user block so nothing overflows", () => {
		useAppStore.getState().setLanguage("ar");
		renderWithProviders(<Sidebar />);

		for (const text of ["مستخدم", "منشئ النظام"]) {
			const paragraph = screen.getByText(text).closest("p");
			expect(paragraph?.className).toContain("truncate");
		}
	});
});
