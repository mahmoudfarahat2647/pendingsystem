import { z } from "zod";
import { ORDER_STAGE_VALUES } from "@/domain/order/orderStage";

export const CategorySchema = z.enum(["note", "reminder", "reason"]);

/**
 * Single source of truth for the category/stage invariant: "note" templates
 * must carry a stage (scoped per tab), every other category must not
 * (global), mirrored by a matching CHECK constraint in the DB.
 */
export const QuickTemplateScopeSchema = z
	.object({
		category: CategorySchema,
		stage: z.enum(ORDER_STAGE_VALUES).optional(),
	})
	.superRefine((val, ctx) => {
		if (val.category === "note" && !val.stage) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["stage"],
				message: "stage is required for note templates",
			});
		}
		if (val.category !== "note" && val.stage) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["stage"],
				message: "stage must not be set for reminder/reason templates",
			});
		}
	});

export const AddTemplateSchema = QuickTemplateScopeSchema.and(
	z.object({ text: z.string().trim().min(1).max(200) }),
);
