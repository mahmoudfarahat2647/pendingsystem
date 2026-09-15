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
		stage: null,
		createdAt: "",
		updatedAt: "",
	},
	{
		id: "2",
		category: "note",
		text: "Template B",
		sortOrder: 0,
		stage: null,
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
		const { result } = renderHook(
			() => useQuickTemplatesQuery("note", "booking"),
			{ wrapper: makeWrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(sampleTemplates);
		expect(mockList).toHaveBeenCalledWith("note", "booking");
	});

	it("fetches global templates for categories that take no stage", async () => {
		mockList.mockResolvedValue(sampleTemplates);

		const { useQuickTemplatesQuery } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const { result } = renderHook(() => useQuickTemplatesQuery("reason"), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockList).toHaveBeenCalledWith("reason", undefined);
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
			stage: null,
			createdAt: "",
			updatedAt: "",
		};
		mockAdd.mockResolvedValue(created);

		const { useQuickTemplatesQuery, useAddQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note", "booking"), {
			wrapper,
		});
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(
			() => useAddQuickTemplateMutation("note", "booking"),
			{ wrapper },
		);
		act(() => {
			mutation.result.current.mutate("New");
		});

		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(mockAdd).toHaveBeenCalledWith("note", "New", "booking");
	});

	it("rolls back optimistic update on error", async () => {
		mockAdd.mockRejectedValue(new Error("Server error"));

		const { useQuickTemplatesQuery, useAddQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note", "booking"), {
			wrapper,
		});
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const before = query.result.current.data;
		const mutation = renderHook(
			() => useAddQuickTemplateMutation("note", "booking"),
			{ wrapper },
		);
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

		const query = renderHook(() => useQuickTemplatesQuery("note", "booking"), {
			wrapper,
		});
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(
			() => useRemoveQuickTemplateMutation("note", "booking"),
			{ wrapper },
		);
		act(() => {
			mutation.result.current.mutate("1");
		});

		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(mockRemove).toHaveBeenCalledWith("1", "note", "booking");
	});
});

describe("unresolved note scope", () => {
	beforeEach(() => {
		mockList.mockReset().mockResolvedValue(sampleTemplates);
		mockAdd.mockReset();
		mockRemove.mockReset();
	});

	it("issues no query when a note has no resolved stage", async () => {
		const { useQuickTemplatesQuery } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const { result } = renderHook(() => useQuickTemplatesQuery("note"), {
			wrapper: makeWrapper(),
		});

		await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
		expect(result.current.isSuccess).toBe(false);
		expect(mockList).not.toHaveBeenCalled();
	});

	it("refuses to add a template when a note has no resolved stage", async () => {
		const { useAddQuickTemplateMutation } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const mutation = renderHook(() => useAddQuickTemplateMutation("note"), {
			wrapper: makeWrapper(),
		});

		act(() => {
			mutation.result.current.mutate("Should never be written");
		});

		await waitFor(() => expect(mutation.result.current.isError).toBe(true));
		expect(mockAdd).not.toHaveBeenCalled();
	});

	it("refuses to remove a template when a note has no resolved stage", async () => {
		const { useRemoveQuickTemplateMutation } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const mutation = renderHook(() => useRemoveQuickTemplateMutation("note"), {
			wrapper: makeWrapper(),
		});

		act(() => {
			mutation.result.current.mutate("some-id");
		});

		await waitFor(() => expect(mutation.result.current.isError).toBe(true));
		expect(mockRemove).not.toHaveBeenCalled();
	});
});

describe("stage scoping", () => {
	beforeEach(() => {
		mockList.mockReset();
		mockAdd.mockReset();
		mockRemove.mockReset();
	});

	it("passes stage through to the service and keeps separate query keys per stage", async () => {
		mockList.mockResolvedValue(sampleTemplates);

		const { useQuickTemplatesQuery } = await import(
			"@/hooks/queries/useQuickTemplatesQuery"
		);
		const wrapper = makeWrapper();

		const bookingQuery = renderHook(
			() => useQuickTemplatesQuery("note", "booking"),
			{ wrapper },
		);
		await waitFor(() =>
			expect(bookingQuery.result.current.isSuccess).toBe(true),
		);

		expect(mockList).toHaveBeenCalledWith("note", "booking");
	});

	it("includes stage on the optimistic add entry", async () => {
		mockList.mockResolvedValue(sampleTemplates);
		// Hold the "add" call open so onSettled's invalidate/refetch (which
		// would otherwise overwrite the optimistic entry with the static
		// mockList data) can't race the assertion below.
		let resolveAdd: ((value: QuickTemplate) => void) | undefined;
		mockAdd.mockImplementation(
			() =>
				new Promise<QuickTemplate>((resolve) => {
					resolveAdd = resolve;
				}),
		);

		const { useQuickTemplatesQuery, useAddQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note", "freeze"), {
			wrapper,
		});
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(
			() => useAddQuickTemplateMutation("note", "freeze"),
			{ wrapper },
		);
		act(() => {
			mutation.result.current.mutate("New");
		});

		await waitFor(() => {
			const optimistic = query.result.current.data?.find(
				(t) => t.text === "New",
			);
			expect(optimistic?.stage).toBe("freeze");
		});
		expect(mockAdd).toHaveBeenCalledWith("note", "New", "freeze");

		resolveAdd?.({
			id: "3",
			category: "note",
			text: "New",
			sortOrder: 0,
			stage: "freeze",
			createdAt: "",
			updatedAt: "",
		});
		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
	});

	it("calls service.remove with the scoped category and stage", async () => {
		mockList.mockResolvedValue(sampleTemplates);
		mockRemove.mockResolvedValue(undefined);

		const { useQuickTemplatesQuery, useRemoveQuickTemplateMutation } =
			await import("@/hooks/queries/useQuickTemplatesQuery");
		const wrapper = makeWrapper();

		const query = renderHook(() => useQuickTemplatesQuery("note", "archive"), {
			wrapper,
		});
		await waitFor(() => expect(query.result.current.isSuccess).toBe(true));

		const mutation = renderHook(
			() => useRemoveQuickTemplateMutation("note", "archive"),
			{ wrapper },
		);
		act(() => {
			mutation.result.current.mutate("1");
		});

		await waitFor(() => expect(mutation.result.current.isSuccess).toBe(true));
		expect(mockRemove).toHaveBeenCalledWith("1", "note", "archive");
	});
});
