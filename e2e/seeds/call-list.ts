import { seedOrder } from "./orders";

export async function seedCallListRow() {
	return seedOrder({
		stage: "call",
		customer_name: "E2E_TEST_CallCustomer",
		vin: "E2EVINCALL",
		status: "Ordered",
		metadata: {
			parts: [{ id: "p1", partNumber: "PN-CALL-001", description: "Call Part", rowId: "r1" }],
			partStatus: "Arrived",
			cntrRdg: 0,
			hasAttachment: false,
			reserved: false,
		},
	});
}
