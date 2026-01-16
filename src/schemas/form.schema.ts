import { z } from 'zod';

export const OrderFormSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    vin: z.string().length(17, "VIN must be exactly 17 characters"),
    mobile: z.string().min(1, "Mobile number is required"),
    cntrRdg: z.string().transform((val) => parseInt(val, 10) || 0),
    model: z.string().min(1, "Vehicle model is required"),
    repairSystem: z.string(),
    startWarranty: z.string(),
    requester: z.string(),
    sabNumber: z.string(),
    acceptedBy: z.string(),
    company: z.string(), // Allowing any string for now, or restrict to specific values if needed
}).refine(
    (data) => {
        // Warranty Ineligibility Rule:
        // If repairSystem is "ضمان" (Warranty) AND mileage (cntrRdg) >= 100,000, it's invalid.
        if (data.repairSystem === "ضمان" && data.cntrRdg >= 100000) {
            return false;
        }
        return true;
    },
    {
        message: "Ineligible for Warranty: Vehicle exceeds 100,000 KM",
        path: ["cntrRdg"]
    }
);
