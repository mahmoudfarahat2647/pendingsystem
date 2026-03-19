import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
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
		ordersRowData: [] as Array<{ vin?: string | null }>,
		rowData: [] as Array<{ vin?: string | null }>,
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

describe("Sidebar", () => {
	beforeEach(() => {
		navigationMocks.pathname = "/orders";
		navigationMocks.push.mockReset();
		storeMocks.state.currentEditVin = null;
		storeMocks.state.clearCurrentEditVin.mockReset();
		storeMocks.state.ordersRowData = [];
		storeMocks.state.rowData = [];
	});

	it("navigates to the dashboard when the logo is clicked", async () => {
		const user = userEvent.setup();

		render(<Sidebar />);

		await user.click(screen.getByRole("link", { name: /go to dashboard/i }));

		expect(navigationMocks.push).toHaveBeenCalledWith("/dashboard");
	});
});
