import { z } from "zod";

export const OrderFormSchema = z
	.object({
		customerName: z.string().min(1, "Customer name is required"),
		vin: z.string().min(1, "VIN is required"),
		mobile: z.string().min(1, "Mobile number is required"),
		cntrRdg: z
			.union([z.string(), z.number()])
			.transform((val) =>
				typeof val === "string" ? parseInt(val, 10) || 0 : val,
			),
		model: z.string().min(1, "Model is required"),
		repairSystem: z.string().default("Mechanical"),
		startWarranty: z.string().optional(),
		requester: z.string().optional(),
		sabNumber: z.string().optional(),
		acceptedBy: z.string().optional(),
		company: z.string().default("pendingsystem"),
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
			.transform((val) =>
				typeof val === "string" ? parseInt(val, 10) || 0 : val,
			),
		model: z.string().min(1, "Vehicle model is required"),
		repairSystem: z.string().min(1, "Repair system is required"),
		sabNumber: z.string().min(1, "SAB Number is required"),
		company: z.string().min(1, "Company is required"),
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
	);
