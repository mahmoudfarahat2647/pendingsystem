import { createSeedClient } from "./supabase";

export const TEST_PREFIX = "E2E_TEST_";

type OrderOverrides = {
	stage?: string;
	status?: string;
	vin?: string;
	customer_name?: string;
	company?: string | null;
	attachment_link?: string;
	attachment_file_path?: string;
	metadata?: Record<string, unknown>;
};

export async function seedOrder(overrides: OrderOverrides = {}) {
	const db = createSeedClient();
	const { data, error } = await db
		.from("orders")
		.insert({
			stage: overrides.stage ?? "orders",
			order_number: `E2E-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			customer_name: overrides.customer_name ?? `${TEST_PREFIX}Customer`,
			customer_phone: "0500000000",
			vin: overrides.vin ?? "E2EVIN001",
			company: overrides.company ?? null,
			attachment_link: overrides.attachment_link ?? "",
			attachment_file_path: overrides.attachment_file_path ?? "",
			status: overrides.status ?? "Pending",
			metadata: {
				parts: [
					{
						id: "e2e-p1",
						partNumber: "PN-E2E-001",
						description: "E2E Test Part",
						rowId: "e2e-r1",
					},
				],
				partStatus: "Ordered",
				cntrRdg: 0,
				hasAttachment: false,
				reserved: false,
				...overrides.metadata,
			},
		})
		.select()
		.single();
	if (error) throw new Error(`seedOrder failed: ${error.message}`);
	return data;
}

/** A row that satisfies all Beast Mode requirements for commit to Main Sheet. */
export async function seedBeastModeOrder() {
	return seedOrder({
		customer_name: `${TEST_PREFIX}BeastCustomer`,
		vin: "E2EVINBEAST",
		attachment_link: "https://example.com/e2e-attachment.pdf",
		metadata: {
			parts: [
				{
					id: "e2e-beast-p1",
					partNumber: "PN-BEAST-001",
					description: "Beast Mode Part",
					rowId: "e2e-beast-r1",
				},
			],
			partStatus: "Arrived",
			cntrRdg: 55000,
			hasAttachment: true,
			attachmentLink: "https://example.com/e2e-attachment.pdf",
			reserved: false,
		},
	});
}

/** A row with all parts marked Arrived — should auto-move to Call List. */
export async function seedArrivedOrder() {
	return seedOrder({
		customer_name: `${TEST_PREFIX}ArrivedCustomer`,
		vin: "E2EVINARRIVED",
		status: "Arrived",
		metadata: {
			parts: [
				{
					id: "e2e-arr-p1",
					partNumber: "PN-ARR-001",
					description: "Arrived Part",
					rowId: "e2e-arr-r1",
				},
			],
			partStatus: "Arrived",
			cntrRdg: 30000,
			hasAttachment: false,
			reserved: false,
		},
	});
}

/** A row missing part number — cannot be committed or booked. */
export async function seedOrderMissingPartNumber() {
	return seedOrder({
		customer_name: `${TEST_PREFIX}MissingPart`,
		vin: "E2EVINMISSING",
		metadata: {
			parts: [
				{
					id: "e2e-miss-p1",
					partNumber: "",
					description: "",
					rowId: "e2e-miss-r1",
				},
			],
			partStatus: "Ordered",
			cntrRdg: 0,
			hasAttachment: false,
		},
	});
}
