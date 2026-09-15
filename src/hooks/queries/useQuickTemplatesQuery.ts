import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrderStage } from "@/domain/order/orderStage";
import { QuickTemplateScopeSchema } from "@/schemas/quickTemplates.schema";
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

/**
 * Reuses the API's own scope rule rather than re-encoding it, so a scope the
 * server would reject (a note without a stage) never reaches the network and
 * can never be written under some other stage's scope.
 */
function isScopeValid(category: TemplateCategory, stage?: OrderStage) {
	return QuickTemplateScopeSchema.safeParse({ category, stage }).success;
}

export function useQuickTemplatesQuery(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	return useQuery({
		queryKey: quickTemplatesQueryKey(category, stage),
		queryFn: () => quickTemplatesService.list(category, stage),
		staleTime: 60_000,
		enabled: isScopeValid(category, stage),
	});
}

export function useAddQuickTemplateMutation(
	category: TemplateCategory,
	stage?: OrderStage,
) {
	const queryClient = useQueryClient();
	const key = quickTemplatesQueryKey(category, stage);

	return useMutation({
		mutationFn: (text: string) => {
			if (!isScopeValid(category, stage)) {
				throw new Error("Cannot add a template without a resolved scope");
			}
			return quickTemplatesService.add(category, text, stage);
		},
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
		mutationFn: (id: string) => {
			if (!isScopeValid(category, stage)) {
				throw new Error("Cannot remove a template without a resolved scope");
			}
			return quickTemplatesService.remove(id, category, stage);
		},
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
