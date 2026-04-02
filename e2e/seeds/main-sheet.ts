import { seedOrder } from "./orders";

export async function seedMainSheetRow() {
	return seedOrder({
		stage: "main",
		customer_name: "E2E_TEST_MainCustomer",
		vin: "E2EVINMAIN",
		status: "Ordered",
	});
}

export async function seedMainSheetArrivedGroup() {
	// Two rows with same VIN, both Arrived — triggers auto-move to Call List
	const vin = "E2EVINMAINAUTO";
	await seedOrder({
		stage: "main",
		customer_name: "E2E_TEST_MainArrived1",
		vin,
		status: "Arrived",
		metadata: {
			parts: [
				{ id: "p1", partNumber: "PN-MA1", description: "Part A", rowId: "r1" },
			],
			partStatus: "Arrived",
			cntrRdg: 0,
			hasAttachment: false,
			reserved: false,
		},
	});
	return seedOrder({
		stage: "main",
		customer_name: "E2E_TEST_MainArrived2",
		vin,
		status: "Arrived",
		metadata: {
			parts: [
				{ id: "p2", partNumber: "PN-MA2", description: "Part B", rowId: "r2" },
			],
			partStatus: "Arrived",
			cntrRdg: 0,
			hasAttachment: false,
			reserved: false,
		},
	});
}
