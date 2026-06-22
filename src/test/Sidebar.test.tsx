import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shared/Sidebar";
import { queryClient } from "@/lib/queryClient";

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

describe("Sidebar", () => {
	beforeEach(() => {
		navigationMocks.pathname = "/orders";
		navigationMocks.push.mockReset();
		storeMocks.state.currentEditVin = null;
		storeMocks.state.clearCurrentEditVin.mockReset();
	});

	it("navigates to the dashboard when the logo is clicked", async () => {
		const user = userEvent.setup();

		render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);

		await user.click(screen.getByRole("link", { name: /go to dashboard/i }));

		expect(navigationMocks.push).toHaveBeenCalledWith("/dashboard");
	});

	it("shows the sign-out menu trigger when sidebar is expanded", () => {
		render(
			<QueryClientProvider client={queryClient}>
				<Sidebar />
			</QueryClientProvider>,
		);
		expect(screen.getByTestId("sign-out-menu")).toBeInTheDocument();
	});
});
