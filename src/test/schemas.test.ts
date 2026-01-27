import { describe, expect, it } from 'vitest';
import { PendingRowSchema, OrderFormSchema } from '../schemas';

describe('Zod Schemas', () => {
    describe('PendingRowSchema', () => {
        it('should validate a valid PendingRow', () => {
            const validRow = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                customerName: "John Doe",
                vin: "VF112345678901234",
                mobile: "01234567890",
                model: "Megane",
                cntrRdg: 1000,
                parts: [],
            };
            const result = PendingRowSchema.safeParse(validRow);
            expect(result.success).toBe(true);
        });

        it('should fail on invalid VIN (empty string)', () => {
            const invalidRow = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                customerName: "John Doe",
                vin: "", // Invalid - empty
                mobile: "01234567890",
                model: "Megane",
            };
            const result = PendingRowSchema.safeParse(invalidRow);
            expect(result.success).toBe(false);
            if (!result.success) {
                const fieldErrors = result.error.flatten().fieldErrors;
                expect(fieldErrors.vin).toBeDefined();
            }
        });

        it('should fail on missing required fields', () => {
            const invalidRow = {
                // Missing customerName, via, etc.
                id: "123e4567-e89b-12d3-a456-426614174000",
            };
            const result = PendingRowSchema.safeParse(invalidRow);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.customerName).toBeDefined();
            }
        });
    });

    describe('OrderFormSchema', () => {
        it('should validate valid form data', () => {
            const validForm = {
                customerName: "Jane Doe",
                vin: "VF112345678901234",
                mobile: "01000000000",
                cntrRdg: "50000",
                model: "Duster",
                repairSystem: "Mechanical",
                startWarranty: "2024-01-01",
                requester: "Admin",
                sabNumber: "SAB123",
                acceptedBy: "Agent",
                company: "Renault"
            };
            const result = OrderFormSchema.safeParse(validForm);
            expect(result.success).toBe(true);
        });

        it('should fail if repairSystem is warranty and mileage > 100k', () => {
            const invalidForm = {
                customerName: "Jane Doe",
                vin: "VF112345678901234",
                mobile: "01000000000",
                cntrRdg: "150000", // > 100k
                model: "Duster",
                repairSystem: "ضمان", // Warranty
                startWarranty: "2024-01-01",
                requester: "Admin",
                sabNumber: "SAB123",
                acceptedBy: "Agent",
                company: "Renault"
            };
            const result = OrderFormSchema.safeParse(invalidForm);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Ineligible for Warranty: Vehicle exceeds 100,000 KM");
                expect(result.error.issues[0].path).toContain("cntrRdg");
            }
        });
    });
});
