import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shared/Sidebar";

const navigationMocks = vi.hoisted(() => ({
	pathname: "/orders",
	push: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
	state: {
		currentEditVin: null as string | null,
		clearCurrentEditVin: vi.fn(),
	},
}));

vi.mock("next/navigation", () => ({
	usePathname: () => navigationMocks.pathname,
	useRouter: () => ({
		push: navigationMocks.push,
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

vi.mock("@/store/useStore", () => ({
	useAppStore: (selector: (state: typeof storeMocks.state) => unknown) =>
		selector(storeMocks.state),
}));

vi.mock("@/components/shared/SettingsModal", () => ({
	SettingsModal: () => null,
}));

vi.mock("@/components/shared/SidebarUserMenu", () => ({
	SidebarUserMenu: ({ trigger }: { trigger: React.ReactNode }) => (
		<div data-testid="sign-out-menu">{trigger}</div>
	),
}));

function renderWithProviders(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return render(ui, { wrapper });
}

describe("Sidebar", () => {
	beforeEach(() => {
		navigationMocks.pathname = "/orders";
		navigationMocks.push.mockReset();
		storeMocks.state.currentEditVin = null;
		storeMocks.state.clearCurrentEditVin.mockReset();
	});

	it("navigates to the dashboard when the logo is clicked", async () => {
		const user = userEvent.setup();

		renderWithProviders(<Sidebar />);

		await user.click(screen.getByRole("link", { name: /go to dashboard/i }));

		expect(navigationMocks.push).toHaveBeenCalledWith("/dashboard");
	});

	it("shows the sign-out menu trigger when sidebar is expanded", () => {
		renderWithProviders(<Sidebar />);
		expect(screen.getByTestId("sign-out-menu")).toBeInTheDocument();
	});
});
