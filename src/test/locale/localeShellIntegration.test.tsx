import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { Sidebar } from "@/components/shared/Sidebar";
import { useAppStore } from "@/store/useStore";

/**
 * The highest shared boundary covering Sidebar + Settings + document
 * attributes + the persisted client preference — the real localization
 * provider and the real Zustand store, exactly as `src/app/layout.tsx` wires
 * them (only routing and the auth session are stubbed). See #255's Testing
 * Decisions: "the primary/highest test seam is the application shell
 * rendered with the real localization provider and persisted preference
 * store."
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

describe("locale switching through the real app shell", () => {
	beforeEach(() => {
		localStorage.clear();
		useAppStore.setState({ locale: "en" });
		document.documentElement.lang = "en";
		document.documentElement.dir = "ltr";
	});

	it("switches the shell to Arabic and back through Settings > Language, with no reload/remount", async () => {
		const user = userEvent.setup();
		renderShell();

		// Starting state: English shell copy, LTR document.
		expect(screen.getByText("Orders")).toBeInTheDocument();
		expect(document.documentElement.lang).toBe("en");
		expect(document.documentElement.dir).toBe("ltr");

		// Open Settings from the sidebar's profile button.
		await user.click(screen.getByRole("button", { name: /user/i }));
		const dialog = await screen.findByRole("dialog");

		// Navigate to the Language section (available regardless of the lock).
		await user.click(within(dialog).getByText("Language"));
		await user.click(within(dialog).getByRole("radio", { name: "العربية" }));

		// Document attributes flip immediately.
		await waitFor(() => {
			expect(document.documentElement.lang).toBe("ar");
			expect(document.documentElement.dir).toBe("rtl");
		});

		// Representative shell copy (sidebar nav) re-renders translated, with
		// no navigation and no shell remount — same DOM subtree, same store.
		expect(await screen.findByText("الطلبات")).toBeInTheDocument();
		expect(screen.queryByText("Orders")).not.toBeInTheDocument();
		expect(
			within(dialog).getByRole("radio", { name: "العربية" }),
		).toBeChecked();

		// Switch back to English.
		await user.click(within(dialog).getByRole("radio", { name: "English" }));

		await waitFor(() => {
			expect(document.documentElement.lang).toBe("en");
			expect(document.documentElement.dir).toBe("ltr");
		});
		expect(await screen.findByText("Orders")).toBeInTheDocument();
		expect(screen.queryByText("الطلبات")).not.toBeInTheDocument();
	});

	it("persists the selected locale in the store's storage key so it survives sign-out (never cleared by it)", async () => {
		const user = userEvent.setup();
		renderShell();

		await user.click(screen.getByRole("button", { name: /user/i }));
		const dialog = await screen.findByRole("dialog");
		await user.click(within(dialog).getByText("Language"));
		await user.click(within(dialog).getByRole("radio", { name: "العربية" }));

		await waitFor(() => {
			expect(useAppStore.getState().locale).toBe("ar");
		});

		const raw = localStorage.getItem("pending-sys-storage-v1.1");
		expect(raw).toBeTruthy();
		expect(JSON.parse(raw as string).state.locale).toBe("ar");
	});
});
