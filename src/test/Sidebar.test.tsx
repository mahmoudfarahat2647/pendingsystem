import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shared/Sidebar";
import { getOrdersQueryKey } from "@/lib/queryClient";
import { PendingRowSchema } from "@/schemas/order.schema";
import type { PendingRow } from "@/types";

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

function makeFreezeRow(id: string, vin: string): PendingRow {
	return PendingRowSchema.parse({
		id,
		stage: "freeze",
		vin,
		customerName: "Frozen Customer",
		parts: [
			{
				id: `p-${id}`,
				partNumber: "PART-1",
				description: "Bumper",
				quantity: 1,
			},
		],
		partNumber: "PART-1",
		description: "Bumper",
		status: "Pending",
		rDate: "2026-09-01",
	});
}

function renderWithProviders(
	ui: React.ReactElement,
	options: { freezeRows?: PendingRow[] } = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	// Pre-seed the freeze stage cache so the sidebar badge derives from React
	// Query state without firing a network fetch (seeded data is fresh under
	// the hook's 5-minute staleTime).
	queryClient.setQueryData(
		getOrdersQueryKey("freeze"),
		options.freezeRows ?? [],
	);
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { ...render(ui, { wrapper }), queryClient };
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

	it("renders Freeze nav item between Archive and Reports, with Reports remaining last", () => {
		renderWithProviders(<Sidebar />);

		const navLinks = screen
			.getAllByRole("link")
			.map((link) => link.getAttribute("href"))
			.filter((href) => href && href !== "/dashboard");

		expect(navLinks).toContain("/freeze");

		const archiveIndex = navLinks.indexOf("/archive");
		const freezeIndex = navLinks.indexOf("/freeze");
		const reportsIndex = navLinks.indexOf("/reports");

		expect(archiveIndex).toBeGreaterThan(-1);
		expect(freezeIndex).toBe(archiveIndex + 1);
		expect(reportsIndex).toBe(freezeIndex + 1);
		expect(reportsIndex).toBe(navLinks.length - 1);
	});

	it("displays the live freeze row count as a badge on the FREEZE nav entry", () => {
		renderWithProviders(<Sidebar />, {
			freezeRows: [
				makeFreezeRow("freeze-row-1", "VIN-FREEZE-001"),
				makeFreezeRow("freeze-row-2", "VIN-FREEZE-002"),
				makeFreezeRow("freeze-row-3", "VIN-FREEZE-001"),
			],
		});

		// Row count, not distinct VINs: two of the three rows share a VIN.
		const freezeLink = screen.getByRole("link", { name: /freeze/i });
		expect(within(freezeLink).getByText("3")).toBeInTheDocument();
	});

	it("hides the badge from other nav entries while Freeze shows its count", () => {
		renderWithProviders(<Sidebar />, {
			freezeRows: [makeFreezeRow("freeze-row-1", "VIN-FREEZE-001")],
		});

		const ordersLink = screen.getByRole("link", { name: /^orders$/i });
		expect(within(ordersLink).queryByText(/\d+/)).not.toBeInTheDocument();
	});

	it("updates the FREEZE badge when the freeze cache changes without remounting", async () => {
		const { queryClient } = renderWithProviders(<Sidebar />, {
			freezeRows: [
				makeFreezeRow("freeze-row-1", "VIN-FREEZE-001"),
				makeFreezeRow("freeze-row-2", "VIN-FREEZE-002"),
			],
		});

		expect(
			within(screen.getByRole("link", { name: /freeze/i })).getByText("2"),
		).toBeInTheDocument();

		// Mirrors what saveDraft/stage mutations do on freeze/unfreeze: they
		// invalidate the freeze + source-stage query keys, the cache refreshes,
		// and the subscribed badge re-renders with no page reload.
		act(() => {
			queryClient.setQueryData(getOrdersQueryKey("freeze"), [
				makeFreezeRow("freeze-row-1", "VIN-FREEZE-001"),
				makeFreezeRow("freeze-row-2", "VIN-FREEZE-002"),
				makeFreezeRow("freeze-row-3", "VIN-FREEZE-003"),
			]);
		});

		expect(
			await within(screen.getByRole("link", { name: /freeze/i })).findByText(
				"3",
			),
		).toBeInTheDocument();
	});
});
