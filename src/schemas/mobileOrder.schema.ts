import { z } from "zod";
import { normalizeNullableCompanyName } from "@/lib/company";
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants";

const MobilePartRowSchema = z.object({
	partNumber: z.string().default(""),
	description: z.string().default(""),
});

export const MobileQuickOrderSchema = z.object({
	customerName: z.string().default(""),
	company: z.preprocess(
		normalizeNullableCompanyName,
		z.enum(ALLOWED_COMPANIES as [string, ...string[]]),
	),
	vin: z.string().default(""),
	mobile: z.string().default(""),
	sabNumber: z.string().default(""),
	model: z.string().default(""),
	repairSystem: z.string().default(""),
	parts: z
		.array(MobilePartRowSchema)
		.default([])
		.transform((rows) =>
			rows.filter(
				(r) => r.partNumber.trim() !== "" || r.description.trim() !== "",
			),
		),
});

export type MobileQuickOrderPayload = z.infer<typeof MobileQuickOrderSchema>;
