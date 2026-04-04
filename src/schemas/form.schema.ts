import { z } from "zod";
import { isAllowedCompanyName, normalizeCompanyName } from "@/lib/company";
import { normalizeMileageAsNumber } from "@/lib/utils";

export const OrderFormSchema = z
	.object({
		customerName: z.string().min(1, "Customer name is required"),
		vin: z.string().min(1, "VIN is required").optional().or(z.literal("")),
		mobile: z.string().min(1, "Mobile number is required"),
		cntrRdg: z.union([z.string(), z.number()]).transform((val, ctx) => {
			const num = normalizeMileageAsNumber(val);
			if (Number.isNaN(num)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid mileage format",
				});
				return z.NEVER;
			}
			return num;
		}),
		model: z.string().optional().or(z.literal("")),
		repairSystem: z.string().default(""),
		startWarranty: z.string().optional(),
		requester: z.string().optional(),
		sabNumber: z.string().optional(),
		acceptedBy: z.string().optional(),
		company: z
			.string()
			.min(1, "Company is required")
			.prefault("")
			.transform(normalizeCompanyName),
	})
	.refine(
		(data) => {
			if (data.repairSystem === "ضمان" && data.cntrRdg >= 100000) {
				return false;
			}
			return true;
		},
		{
			message: "Ineligible for Warranty: Vehicle exceeds 100,000 KM",
			path: ["cntrRdg"],
		},
	)
	.refine(
		(data) => {
			return isAllowedCompanyName(data.company);
		},
		{
			message: "Invalid company. Only Zeekr and Renault are allowed",
			path: ["company"],
		},
	);

// Beast Mode: All fields mandatory
// CRITICAL: DO NOT RELAX VALIDATION - Enforces data integrity on Commit
export const BeastModeSchema = z
	.object({
		customerName: z.string().min(1, "Customer name is required"),
		vin: z.string().min(1, "VIN is required"),
		mobile: z.string().min(1, "Mobile number is required"),
		cntrRdg: z
			.union([z.string(), z.number()])
			.transform((val, ctx) => {
				const num = normalizeMileageAsNumber(val);
				if (Number.isNaN(num)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Invalid mileage format",
					});
					return z.NEVER;
				}
				return num;
			})
			.pipe(z.number().min(1, "KM reading is required")),
		model: z.string().min(1, "Vehicle model is required"),
		repairSystem: z.string().min(1, "Repair system is required"),
		sabNumber: z.string().min(1, "SAB Number is required"),
		company: z
			.string()
			.min(1, "Company is required")
			.transform(normalizeCompanyName),
		requester: z.string().min(1, "Branch/Requester is required"),
		acceptedBy: z.string().min(1, "Agent name is required"),
	})
	.refine(
		(data) => {
			if (data.repairSystem === "ضمان" && data.cntrRdg >= 100000) {
				return false;
			}
			return true;
		},
		{
			message: "Ineligible for Warranty: Vehicle exceeds 100,000 KM",
			path: ["cntrRdg"],
		},
	)
	.refine(
		(data) => {
			return isAllowedCompanyName(data.company);
		},
		{
			message: "Invalid company. Only Zeekr and Renault are allowed",
			path: ["company"],
		},
	);
