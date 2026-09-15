import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import {
	type QuickTemplate,
	quickTemplatesService,
	type TemplateCategory,
} from "@/services/quickTemplatesService";

function quickTemplatesQueryKey(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	return ["quickTemplates", category, stage ?? null] as const;
}

export function useQuickTemplatesQuery(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	return useQuery({
		queryKey: quickTemplatesQueryKey(category, stage),
		queryFn: () => quickTemplatesService.list(category, stage),
		staleTime: 60_000,
	});
}

export function useAddQuickTemplateMutation(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	const queryClient = useQueryClient();
	const key = quickTemplatesQueryKey(category, stage);

	return useMutation({
		mutationFn: (text: string) =>
			quickTemplatesService.add(category, text, stage),
		onMutate: async (text) => {
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData<QuickTemplate[]>(key);
			const optimistic: QuickTemplate = {
				id: `temp-${Date.now()}`,
				category,
				text,
				sortOrder: 0,
				stage: stage ?? null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			queryClient.setQueryData<QuickTemplate[]>(key, (old = []) => [
				...old,
				optimistic,
			]);
			return { previous };
		},
		onError: (_error, _text, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(key, context.previous);
			}
			toast.error("Failed to add template");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: key });
		},
	});
}

export function useRemoveQuickTemplateMutation(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	const queryClient = useQueryClient();
	const key = quickTemplatesQueryKey(category, stage);

	return useMutation({
		mutationFn: (id: string) =>
			quickTemplatesService.remove(id, category, stage),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData<QuickTemplate[]>(key);
			queryClient.setQueryData<QuickTemplate[]>(key, (old = []) =>
				old.filter((t) => t.id !== id),
			);
			return { previous };
		},
		onError: (_error, _id, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(key, context.previous);
			}
			toast.error("Failed to remove template");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: key });
		},
	});
}
