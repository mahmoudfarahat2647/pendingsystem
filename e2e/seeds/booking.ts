import { seedOrder } from "./orders";

export async function seedBookingRow() {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	return seedOrder({
		stage: "booking",
		customer_name: "E2E_TEST_BookingCustomer",
		vin: "E2EVINBOOK",
		status: "Booked",
		metadata: {
			parts: [
				{
					id: "p1",
					partNumber: "PN-BOOK-001",
					description: "Booking Part",
					rowId: "r1",
				},
			],
			partStatus: "Arrived",
			cntrRdg: 0,
			hasAttachment: false,
			reserved: false,
			bookingDate: tomorrow.toISOString().split("T")[0],
			bookingNote: "E2E Test Booking",
		},
	});
}
