import { z } from "zod";
import { normalizeNullableCompanyName } from "@/domain/company/company";
import { ALLOWED_COMPANIES } from "@/domain/order/constants";

const MobilePartRowSchema = z.object({
	partNumber: z.string().max(100).default(""),
	description: z.string().max(500).default(""),
});

export const MobileQuickOrderSchema = z.object({
	customerName: z.string().max(120).default(""),
	company: z.preprocess(
		normalizeNullableCompanyName,
		z.enum([...ALLOWED_COMPANIES] as [string, ...string[]]),
	),
	vin: z.string().max(64).default(""),
	mobile: z.string().max(32).default(""),
	sabNumber: z.string().max(64).default(""),
	model: z.string().max(80).default(""),
	repairSystem: z.string().max(80).default(""),
	parts: z
		.array(MobilePartRowSchema)
		.max(50)
		.default([])
		.transform((rows) =>
			rows.filter(
				(r) => r.partNumber.trim() !== "" || r.description.trim() !== "",
			),
		),
});

export type MobileQuickOrderPayload = z.infer<typeof MobileQuickOrderSchema>;
