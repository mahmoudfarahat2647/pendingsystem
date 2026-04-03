import { seedOrder } from "./orders";

export async function seedArchiveRow() {
	return seedOrder({
		stage: "archive",
		customer_name: "E2E_TEST_ArchiveCustomer",
		vin: "E2EVINARCH",
		status: "Archived",
		metadata: {
			parts: [
				{
					id: "p1",
					partNumber: "PN-ARCH-001",
					description: "Archive Part",
					rowId: "r1",
				},
			],
			partStatus: "Arrived",
			cntrRdg: 0,
			hasAttachment: false,
			reserved: false,
			archiveReason: "E2E Test Archive",
			bookingDate: "2025-01-15",
		},
	});
}
