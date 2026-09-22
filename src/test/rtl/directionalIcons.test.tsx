import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { Sidebar } from "@/components/shared/Sidebar";
import { useAppStore } from "@/store/useStore";

/**
 * Issue #265 acceptance criterion: directional icons mirror (or swap) only
 * where direction is part of their semantics, and a representative neutral
 * icon is verified unchanged — proving mirroring is intentional, not a
 * blanket transform. Uses the real Sidebar through the real LocaleProvider,
 * the same shell seam as `src/test/locale/localeShellIntegration.test.tsx`.
 */

vi.mock("next/navigation", () => ({
	usePathname: () => "/orders",
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...props
	}: ComponentProps<"a"> & { href: string }) => (
		<a {...props} href={href}>
			{children}
		</a>
	),
}));

function renderShell() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<LocaleProvider>{children}</LocaleProvider>
		</QueryClientProvider>
	);
	return render(<Sidebar />, { wrapper });
}

describe("directional icon mirroring", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("marks the sidebar collapse chevron (a directional control) to mirror in RTL", () => {
		useAppStore.setState({ locale: "ar" });
		const { container } = renderShell();

		// Sidebar starts expanded, so the collapse button renders ChevronLeft.
		const chevron = container.querySelector(".lucide-chevron-left");
		expect(chevron).not.toBeNull();
		expect(chevron?.getAttribute("class")).toContain("rtl:-scale-x-100");
	});

	it("leaves a representative neutral icon (the Freeze nav Snowflake) unmirrored in RTL", () => {
		useAppStore.setState({ locale: "ar" });
		const { container } = renderShell();

		const snowflake = container.querySelector(".lucide-snowflake");
		expect(snowflake).not.toBeNull();
		expect(snowflake?.getAttribute("class")).not.toContain("rtl:-scale-x-100");
	});

	it("still mirrors the same collapse chevron class in LTR (class is direction-agnostic; the `rtl:` variant only activates under an rtl ancestor)", () => {
		useAppStore.setState({ locale: "en" });
		const { container } = renderShell();

		const chevron = container.querySelector(".lucide-chevron-left");
		expect(chevron?.getAttribute("class")).toContain("rtl:-scale-x-100");
	});
});
