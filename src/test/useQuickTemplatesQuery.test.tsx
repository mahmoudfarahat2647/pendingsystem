import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QuickTemplate } from "@/services/quickTemplatesService";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockList = vi.fn();
const mockAdd = vi.fn();
const mockRemove = vi.fn();

vi.mock("@/services/quickTemplatesService", () => ({
	quickTemplatesService: {
		list: (...args: unknown[]) => mockList(...args),
		add: (...args: unknown[]) => mockAdd(...args),
		remove: (...args: unknown[]) => mockRemove(...args),
	},
}));

function makeWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

const sampleTemplates: QuickTemplate[] = [
	{
		id: "1",
		category: "note",
		text: "Template A",
		sortOrder: 0,
		createdAt: "",
		updatedAt: "",
	},
	{
		id: "2",
		category: "note",
		text: "Template B",
		sortOrder: 0,
		createdAt: "",
		updatedAt: "",
	},
];

describe("useQuickTemplatesQuery", () => {
	beforeEach(() => {
		mockList.mockReset();
		mockAdd.mockReset();
		mockRemove.mockReset();
	});

	it("returns templates from the service", async () => {
		mockList.mockResolvedValue(sampleTemplates);

		const { useQuickTemplatesQuery } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const { result } = renderHook(() => useQuickTemplatesQuery("note"), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(sampleTemplates);
		expect(mockList).toHaveBeenCalledWith("note");
	});
});

describe("useAddQuickTemplateMutation", () => {
	beforeEach(() => {
		mockList.mockResolvedValue(sampleTemplates);
		mockAdd.mockReset();
	});

	it("calls service.add and optimistically appends the template", async () => {
		const created: QuickTemplate = {
			id: "3",
			category: "note",
			text: "New",
			sortOrder: 0,
			createdAt: "",
			updatedAt: "",
		};
		mockAdd.mockResolvedValue(created);

		const { useQuickTemplatesQuery, useAddQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note"), { wrapper });
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(() => useAddQuickTemplateMutation("note"), {
			wrapper,
		});
		act(() => {
			mutation.result.current.mutate("New");
		});

		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(mockAdd).toHaveBeenCalledWith("note", "New");
	});

	it("rolls back optimistic update on error", async () => {
		mockAdd.mockRejectedValue(new Error("Server error"));

		const { useQuickTemplatesQuery, useAddQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note"), { wrapper });
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const before = query.result.current.data;
		const mutation = renderHook(() => useAddQuickTemplateMutation("note"), {
			wrapper,
		});
		act(() => {
			mutation.result.current.mutate("Bad");
		});

		await waitFor(() => expect(mutation.result.current.isError).toBe(true));
		expect(query.result.current.data).toEqual(before);
	});
});

describe("useRemoveQuickTemplateMutation", () => {
	beforeEach(() => {
		mockList.mockResolvedValue(sampleTemplates);
		mockRemove.mockReset();
	});

	it("calls service.remove and optimistically removes the template", async () => {
		mockRemove.mockResolvedValue(undefined);

		const { useQuickTemplatesQuery, useRemoveQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note"), { wrapper });
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(() => useRemoveQuickTemplateMutation("note"), {
			wrapper,
		});
		act(() => {
			mutation.result.current.mutate("1");
		});

		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(mockRemove).toHaveBeenCalledWith("1");
	});
});
